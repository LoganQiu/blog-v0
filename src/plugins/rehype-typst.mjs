// HAST 阶段把 <pre><code class="language-typst">…</code></pre> → 内联 SVG/HTML
import { visit } from 'unist-util-visit'

// CJS 包：默认导入再解构
import nodeCompilerMod from '@myriaddreamin/typst-ts-node-compiler'
const { NodeCompiler } = nodeCompilerMod

// 单例编译器（构建期/SSR 重用）
const compilerP = Promise.resolve(
  NodeCompiler.create({
    // 如需中文等字体：fontArgs: [{ fontPaths: ['public/fonts'] }],
    // workspace: '.', // 如需要相对路径/包导入
  }),
)

// 简单内容缓存（避免重复编译）
const cache = new Map()

export default function rehypeTypst(options = {}) {
  const { target = 'svg' } = options

  return async function transformer(tree) {
    // 防呆：如果某些阶段意外调用，直接跳过
    if (!tree || typeof tree !== 'object' || !('type' in tree)) return

    const compiler = await compilerP
    const jobs = []

    visit(tree, 'element', (node, index, parent) => {
      if (!parent || node.tagName !== 'pre') return
      // 只处理 <pre><code class="language-typst">…</code></pre>
      const code = node.children?.[0]
      if (!code || code.type !== 'element' || code.tagName !== 'code') return

      const classList = new Set(
        Array.isArray(code.properties?.className) ? code.properties.className : [],
      )
      if (!classList.has('language-typst')) return

      // 取文本内容
      const rawText = (code.children ?? [])
        .filter((c) => c.type === 'text')
        .map((c) => c.value)
        .join('')

      jobs.push(
        (async () => {
          const key = `${target}:${rawText}`
          let html = cache.get(key)

          if (!html) {
            try {
              html =
                target === 'html'
                  ? await compiler.plainHtml({ mainFileContent: rawText })
                  : await compiler.plainSvg({  mainFileContent: rawText }) // 返回 <svg>…</svg>
              cache.set(key, html)
            } catch (e) {
              // 编译失败时：回退为原始 <pre>（不影响整篇文档渲染）
              return
            }
          }

          // 用 raw HTML 节点替换整个 <pre>（交给 rehype-raw 解析）
          parent.children[index] = { type: 'raw', value: html }
        })(),
      )
    })

    await Promise.all(jobs)
  }
}
