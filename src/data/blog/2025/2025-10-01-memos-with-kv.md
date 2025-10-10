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
status: deprecated
---

> 思前想后，这种方法心智负担过重，给博客也引入了过多插件，决定还是整个 [usememos](https://github.com/usememos/memos)，无论是从数据备份还是界面美观程度都更胜一筹，等挑选到合适的 VPS 就把现在的 Memos 给替换掉。

## 前言

这玩意我想搞好久了，不过一直懒得租用服务器想要取巧。碰巧刷到 [在 VitePress 中实现一个动态说说功能
](https://shinya.click/fiddling/vitepress-memos-component/)，作者真是天才般的想法利用大善人 Cloudflare 的 KV 来存储数据，我直接上手。

## 后端

基本复刻上面博客中的部分，防止原文消失，这边做了一个备份：[vitepress-memos-component-test](/vitepress-memos-component.txt)

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

为了提升加载速度，以及减少对 KV 的直接读的次数，原作者把前十条拉到本地 `memos.json` 直接加载，这就需要加一个脚本在构建博客前先执行拉取动作。

```js title="./src/scripts/prefetch-memos.mjs"
// 构建前跑：从你的 Worker API 拉 “第 1 页 / 前 10 条” 写到 public/memos.json
// 逻辑与原文一致：首屏不打 Worker，直接读这个静态文件。

import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import process from "node:process";

const API_ORIGIN = process.env.MEMOS_API_ORIGIN || "你的 memos 部署 url";

// 约定与后端一致：offset=0, limit=10
const url = `${API_ORIGIN}/api/memos?offset=0&limit=10`;

const res = await fetch(url, { headers: { "accept": "application/json" } });
if (!res.ok) {
  console.error(`[prefetch-memos] Fetch failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const response = await res.json();
// API返回的是 { data: [...], total, hasMore }，需要提取data数组
const list = response.data || [];

// 写入静态文件
const out = "public/memos.json";
await mkdir(dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(list, null, 2), "utf-8");
console.log(`[prefetch-memos] Wrote ${out} with ${list.length} items`);
```

再修改 `package.json`：

```json ins={3}
"scripts": {
  "dev": "astro dev",
  "prebuild": "node ./src/scripts/prefetch-memos.mjs",
  "build": "astro build",
  "preview": "astro preview",
  "astro": "astro"
},
```

还是有点麻烦的，为了省个 VPS 钱，值不值呢？
