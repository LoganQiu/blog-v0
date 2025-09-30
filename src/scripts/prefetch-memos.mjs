// 构建前跑：从你的 Worker API 拉 “第 1 页 / 前 10 条” 写到 public/memos.json
// 逻辑与原文一致：首屏不打 Worker，直接读这个静态文件。

import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import process from "node:process";

const API_ORIGIN = process.env.MEMOS_API_ORIGIN || "https://memos.zeratulqiu.me";

// 约定与后端一致：page=1, limit=10
const url = `${API_ORIGIN}/api/memos?page=1&limit=10`;

const res = await fetch(url, { headers: { "accept": "application/json" } });
if (!res.ok) {
  console.error(`[prefetch-memos] Fetch failed: ${res.status} ${res.statusText}`);
  process.exit(1);
}
const list = await res.json();

// 写入静态文件
const out = "public/memos.json";
await mkdir(dirname(out), { recursive: true });
await writeFile(out, JSON.stringify(list, null, 2), "utf-8");
console.log(`[prefetch-memos] Wrote ${out} with ${Array.isArray(list) ? list.length : 0} items`);
