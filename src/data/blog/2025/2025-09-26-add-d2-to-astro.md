---
title: "如何在 Astro 中添加 D2 图表"
desc: "在博客中应当有图表能表达一些信息，Mermaid 很好，但是与 Astro 集成很麻烦，于是选择了更加美观的 D2，本文记录了详细过程。"
slug: how-to-add-d2-to-astro
pubdate: 2025-09-26
categories:
  - Tech 技术
tags:
  - blog
  - astro
---

有多种解决方案可以将图表以声明方式嵌入到 Markdown 内容中，并将其渲染到文档网站上。这些解决方案通常需要利用 Mermaid、PlantUML 或 Graphviz 等图表工具。大多数情况下，渲染此类图表需要权衡各种因素，例如在页面中嵌入 JavaScript 来渲染图表，使用速度较慢的解决方案（例如 Playwright ）在构建时渲染图表，或者不支持暗黑模式。

D2 可以很好的规避上述各种缺陷，所以成为优先选择。

## 集成步骤

### 步骤1：安装 D2 进行本地开发

首先要明白 [D2](https://d2lang.com/) 是一个用 Go 写的命令行工具，并不是 JS 库，所以要先本地下载，以便预览正在构建的图表。根据 D2 的官方安装指南 ，最简单的方法是运行他们提供的 shell 脚本：

```shell
# With --dry-run the install script will print the commands it will use
# to install without actually installing so you know what it's going to do.
curl -fsSL https://d2lang.com/install.sh | sh -s -- --dry-run
# If things look good, install for real.
curl -fsSL https://d2lang.com/install.sh | sh -s --
```

当然也可以用包管理器进行下载（macOS 上的 Homebrew，Windows 上的 Scoop 等等）。

### 步骤2：安装 astro-d2

```shell
pnpm dlx astro add astro-d2
```

> [!warning]
> 由于我们希望将 D2 代码块渲染为图表，因此 `d2()` 集成应该出现在 `astro.config.ts` 文件中 `mdx()` 集成之前。如果您使用了 Expressive Code ，则也应该出现在 `expressiveCode()` 集成之前（而 `expressiveCode()` 本身应该出现在 `mdx()` 之前）。
>
> ```js title="astro.config.mjs"
> export default defineConfig({
>   // ... other config
>   integrations: [
>     d2(),
>     expressiveCode(),
>     mdx(),
>     // ... other integrations
>   ]
>   // ... other config
> })
> ```

### 步骤3：忽略生成的图表

插件 astro-d2 提供了两种方式处理图表生成：

1. 直接本地生成然后在配置中设置 `skipGeneration` 以及对应参数。
2. 将本地预览时生成的 svg 图片忽略，在对应平台构建时直接生成。

我选择第二种，这是最稳妥的方式，所以对 `.gitignore` 进行更改：

```shell title=".gitignore" ins={1-2}
# generated d2 diagrams
public/d2/
```

### 步骤4：把 D2 加入构建中

这一步要根据发布的平台各自设置，我是 Cloudflare 一条龙，就是在对应的 Workers 或者 Pages 的设置中，找到构建配置，把构建命令改成 `curl -fsSL https://d2lang.com/install.sh | sh -s -- && export PATH=$HOME/.d2/bin:$PATH && pnpm install && pnpm run build` 就可以了。

## 简单配置

有关可用配置选项的更多信息，请参阅 [Astro-D2 文档](https://astro-d2.vercel.app/)，这些选项可以在 `astro.config.ts` 中进行全局设置，也可以使用属性在每个代码块上进行覆盖，如下面的 `sketch`。

````md
```d2 sketch
# A simple flowchart
direction: right
D2 Blocks {shape: document}
D2 Blocks -> Astro D2: processes {style.animated: true}
Astro D2 -> SVGs: generates {style.animated: true}
```
````

生成如下图表：

```d2 sketch
# A simple flowchart
direction: right
D2 Blocks {shape: document}
D2 Blocks -> Astro D2: processes {style.animated: true}
Astro D2 -> SVGs: generates {style.animated: true}
```

D2 官方文档里写有三种布局引擎：**Dagre**，**ELK**，**TALA**。

其中 **Dagre** 也是 Mermaid 使用的，但过于丑陋，不推荐；**ELK** 是较新的布局算法，也较为美观，十分推荐；**TALA** 确实最为优雅，但是需要付费授权。

那么我就把在 `astro.config.mjs` 中添加的集成代码修改如下：

```js
    d2({
      layout: "elk",
    }),
```

## 参考

- [Add diagrams to your Astro site with D2 | Aaron Becker](https://aaronjbecker.com/posts/adding-d2-diagrams-to-astro/)
- [Add diagrams to your Starlight documentation using D2 | HiDeoo](https://hideoo.dev/notes/starlight-add-diagrams-using-d2/)

关于 Mermaid 和 D2 的比较可以看看这篇文章：[Mermaid vs D2: Comparing Open-Source Text-to-Diagram Tools | Aaron Becker](https://aaronjbecker.com/posts/mermaid-vs-d2-comparing-text-to-diagram-tools/)