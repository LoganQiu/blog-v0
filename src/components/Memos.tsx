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

  // 直接从 API 获取最新数据，跳过静态文件
  useEffect(() => {
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 抽出来的页加载器：与后端对齐 offset/limit
  const fetchPage: Fetcher = async (p, limit) => {
    const offset = (p - 1) * limit;  // 页码转换为偏移量
    const url = `${apiBase}/api/memos?offset=${offset}&limit=${limit}`;
    const r = await fetch(url, { headers: { accept: "application/json" } });
    if (!r.ok) throw new Error(`Fetch ${url} ${r.status}`);
    const response = await r.json();
    // API返回的是 { data: [...], total, hasMore }，需要提取data数组
    const list = (response.data || []) as Memo[];
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
          className="border-t border-muted/40"
        >
          <time className="block text-sm text-muted mb-2">
            {new Date(m.createTime).toLocaleString()}
          </time>
          <div
            dangerouslySetInnerHTML={{ __html: m.__html }}
          />
        </article>
      ))}

      {hasMore && (
        <button
          type="button"
          onClick={() => loadPage(page + 1)}
          disabled={loading}
          className="px-3 py-2 rounded-md border disabled:opacity-50"
        >
          {loading ? "加载中…" : "加载更多"}
        </button>
      )}
    </section>
  );
}
