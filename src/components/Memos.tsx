import { useEffect, useMemo, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

type Memo = {
  uid: string;
  createTime: string; // ISO 字符串
  content: string;    // Markdown
};

type Fetcher = (page: number, limit: number) => Promise<Memo[]>;

// 工具：把 Markdown 渲染为干净的 HTML（保持原文“前端解析”的逻辑）
function renderMarkdown(md: string) {
  const raw = marked.parse(md) as string;
  return DOMPurify.sanitize(raw);
}

export default function Memos(props: {
  apiBase?: string;    // 可选：/api，或完整域名；默认同域
  pageSize?: number;   // 每页条数，默认 10（和预取一致）
}) {
  const pageSize = props.pageSize ?? 10;
  const apiBase = props.apiBase ?? ""; // 与 Worker 反代在同域时留空
  const [memos, setMemos] = useState<Memo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const firstLoadDoneRef = useRef(false);

  // 与原逻辑一致：先尝试读取 /memos.json（编译期产物，前 10 条）
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/memos.json", { cache: "no-cache" });
        if (cancelled) return;
        if (r.ok) {
          const list = (await r.json()) as Memo[];
          if (Array.isArray(list) && list.length) {
            setMemos(list);
            firstLoadDoneRef.current = true;
            return;
          }
        }
        // 如果没有 memos.json 或为空，再回退到线上 API 的第一页
        await loadPage(1);
      } catch {
        await loadPage(1);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 抽出来的页加载器：与后端对齐 page/limit
  const fetchPage: Fetcher = async (p, limit) => {
    const url = `${apiBase}/api/memos?page=${p}&limit=${limit}`;
    const r = await fetch(url, { headers: { accept: "application/json" } });
    if (!r.ok) throw new Error(`Fetch ${url} ${r.status}`);
    const list = (await r.json()) as Memo[];
    return list;
  };

  const loadPage = async (p: number) => {
    setLoading(true);
    try {
      const list = await fetchPage(p, pageSize);
      setMemos((prev) => (p === 1 && !firstLoadDoneRef.current ? list : [...prev, ...list]));
      setPage(p);
      setHasMore(list.length === pageSize); // 满页则默认还有下一页
    } catch (e) {
      console.error(e);
      // 失败时不要改变 hasMore 与 page，避免坏状态
    } finally {
      setLoading(false);
    }
  };

  // 渲染好的 HTML（memoized）
  const rendered = useMemo(
    () =>
      memos.map((m) => ({
        ...m,
        __html: renderMarkdown(m.content),
      })),
    [memos]
  );

  return (
    <section className="space-y-4">
      {rendered.map((m) => (
        <article
          key={m.uid}
          className="rounded-lg border border-muted/40 bg-background/60 shadow-sm p-4"
        >
          <time className="block text-xs text-muted mb-2">
            {new Date(m.createTime).toLocaleString()}
          </time>
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: m.__html }}
          />
        </article>
      ))}

      {hasMore && (
        <button
          type="button"
          onClick={() => loadPage(page + 1)}
          disabled={loading}
          className="px-3 py-2 rounded-md bg-accent text-white text-sm hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "加载中…" : "加载更多"}
        </button>
      )}
    </section>
  );
}
