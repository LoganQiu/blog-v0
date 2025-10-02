import { visit } from "unist-util-visit";
import { fromHtml } from "hast-util-from-html";

// CJS 包：默认导入再解构
import nodeCompilerMod from "@myriaddreamin/typst-ts-node-compiler";
const { NodeCompiler } = nodeCompilerMod;

// 单例编译器（构建期/SSR 重用）
const compilerP = Promise.resolve(
  NodeCompiler.create({
    // 如需中文等字体：fontArgs: [{ fontPaths: ['public/fonts'] }],
    // workspace: '.', // 如需要相对路径/包导入
  })
);

// 简单内容缓存（避免重复编译）
const cache = new Map();

function makeResponsive(svg) {
  // 为 SVG 添加响应式样式，使其居中并在需要时自动缩放
  return svg.replace(/<svg\b([^>]*)>/i, (match, attrs) => {
    const widthMatch = attrs.match(/\swidth="([^"]*)"/i);
    const heightMatch = attrs.match(/\sheight="([^"]*)"/i);

    const widthValue = widthMatch?.[1];
    const heightValue = heightMatch?.[1];

    // 移除原有的 width 和 height 属性
    let newAttrs = attrs.replace(/\swidth="[^"]*"/gi, "").replace(/\sheight="[^"]*"/gi, "");

    // 添加或更新 class 属性
    if (/\sclass="/i.test(newAttrs)) {
      newAttrs = newAttrs.replace(/\sclass="([^"]*)"/i, (_, classes) => ` class="${classes} typst-figure"`);
    } else {
      newAttrs += ' class="typst-figure"';
    }

    // 设置响应式宽度和居中样式
    const desiredWidth = widthValue ? `min(100%, ${widthValue})` : "100%";
    const responsiveStyle = `width:${desiredWidth};height:auto;display:block;margin:0 auto;`;

    // 添加或更新 style 属性
    if (/\sstyle="/i.test(newAttrs)) {
      newAttrs = newAttrs.replace(/\sstyle="([^"]*)"/i, (_, styles) => ` style="${styles} ${responsiveStyle}"`);
    } else {
      newAttrs += ` style="${responsiveStyle}"`;
    }

    // 确保有 preserveAspectRatio 属性
    if (!/\spreserveAspectRatio=/i.test(newAttrs)) {
      newAttrs += ' preserveAspectRatio="xMidYMid meet"';
    }

    return `<svg${newAttrs}>`;
  });
}

export default function rehypeTypst(options = {}) {
  const { target = "svg" } = options;

  return async function transformer(tree) {
    // 防呆：如果某些阶段意外调用，直接跳过
    if (!tree || typeof tree !== "object" || !("type" in tree)) return;

    const compiler = await compilerP;
    const replacements = [];

    visit(tree, "element", (node, index, parent) => {
      if (!parent || node.tagName !== "pre") return;
      // 只处理 <pre><code class="language-typst">…</code></pre>
      const code = node.children?.[0];
      if (!code || code.type !== "element" || code.tagName !== "code") return;

      const classList = new Set(Array.isArray(code.properties?.className) ? code.properties.className : []);
      if (!classList.has("language-typst")) return;

      // 取文本内容
      const rawText = (code.children ?? [])
        .filter((c) => c.type === "text")
        .map((c) => c.value)
        .join("");

      replacements.push({ parent, index, rawText });
    });

    if (!replacements.length) return;

    await Promise.all(
      replacements.map(async (entry) => {
        const { parent, index, rawText } = entry;
        const key = `${target}:${rawText}`;
        let html = cache.get(key);

        if (!html) {
          try {
            html =
              target === "html"
                ? await compiler.plainHtml({ mainFileContent: rawText })
                : await compiler.plainSvg({ mainFileContent: rawText });
            cache.set(key, html);
          } catch (_error) {
            return;
          }
        }

        if (target === "svg") {
          html = makeResponsive(html);
        }

        const fragment = fromHtml(html, { fragment: true });
        const nodes = fragment.type === "root" ? fragment.children ?? [] : [];
        if (!nodes.length) return;

        entry.nodes = nodes;
      })
    );

    const grouped = new Map();
    for (const entry of replacements) {
      if (!entry.nodes?.length) continue;
      if (!grouped.has(entry.parent)) grouped.set(entry.parent, []);
      grouped.get(entry.parent).push(entry);
    }

    for (const [parent, entries] of grouped.entries()) {
      entries
        .sort((a, b) => b.index - a.index)
        .forEach(({ index, nodes }) => {
          parent.children.splice(index, 1, ...nodes);
        });
    }
  };
}
