---
title: "在博客中手搓 memos（碎碎念）页面"
desc: "利用大善人 Cloudflare 的 KV 存储 memos 然后拉取到自己博客中展示"
slug: memos-with-kv
pubdate: 2025-10-01
categories:
  - Tech 技术
tags:
  - blog
  - memos
---

> 思前想后，这种方法心智负担过重，给博客也引入了过多插件，决定还是整个 [usememos](https://github.com/usememos/memos)，无论是从数据备份还是界面美观程度都更胜一筹，等挑选到合适的 VPS 就把现在的 Memos 给替换掉。

## 前言

这玩意我想搞好久了，不过一直懒得租用服务器想要取巧。碰巧刷到 [在 VitePress 中实现一个动态说说功能
](https://shinya.click/fiddling/vitepress-memos-component/)，作者真是天才般的想法利用大善人 Cloudflare 的 KV 来存储数据，我直接上手。

## 后端

基本复刻上面博客中的部分，防止原文消失，这边做了一个备份：[vitepress-memos-component-test](/public/vitepress-memos-component.txt)/[vitepress-memos-component](/public/raw-viewer.html?file=/vitepress-memos-component.txt)

## 前端

前端部分原文是利用 vitepress 写了个组件，我对 Vue 不是很熟悉，改用 React 组件（其实对 React 也不熟，纯用 AI 哐哐写），详细代码可以参考 [edcff6e](https://github.com/LoganQiu/Akilae/commit/edcff6e919cd18998763f06736bd4021b18a2575) 这个 commit，下面讲一下步骤：

首先安装依赖：

```shell
pnpm astro add react
pnpm add marked
pnpm add dompurify
```

然后创建组件：

```ts title="./src/components/Memos.tsx"
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
```

然后就是把组件导入页面展示即可：

```astro
---
// 其他
import Memo from "@/components/Memos";
---

<!-- 其他 -->
<!-- 同域反代：直接用默认 props；若 API 不同域，可传 apiBase="https://your-worker.example.com" -->
<Memo client:load />

```
