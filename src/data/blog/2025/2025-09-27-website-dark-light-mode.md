---
title: "网页深浅模式切换的最佳实践"
desc: ""
slug: theme-toggle-best-practices
pubdate: 2025-09-27
categories:
  - Tech 技术
tags:
  - frontend
---

一般而言，浅色深色模式切换，目前最常用和规范的实现方式是在 `<html>` 中添加 `data-theme="light/dark"`，然后在写主题加载逻辑时按一以下步骤：

1. 获取系统偏好，即通过 `prefers-color-scheme` 拿到当前系统深浅模式。
2. 初始化主题（优先级：用户选择 > 系统偏好）。
3. 监听系统主题变化，用户若手动切换主题，则保存选择。

更高级方案是在 light/dark 基础上在增加了 auto 选项，即始终跟着系统走。

上述这些的具体切换代码相当简单，网上到处都是，这里就不写了。我写这篇的主要原因是遇到了个麻烦：***D2 生成的图只支持根据 `prefers-color-scheme` 切换模式，但我的 Astro 博客使用了 `data-theme="light/dark"` 方式***。

捣鼓好久没搞定，直到看到了 [Starlight](https://starlight.astro.build/) 的 [css 文件](https://github.com/withastro/starlight/blob/5787485f11d0ef1dc9432e11d892a3d04a54b0e1/docs/lunaria/styles.css) 豁然开朗，里面有这样一段代码：

```css
:root[data-theme="light"] {
  color-scheme: light;
}
:root[data-theme="dark"] {
  color-scheme: dark;
}
```

也就是直接告诉浏览器：我页面就是深色/浅色，请按深色/浅色方式渲染默认元素。`color-scheme` 这个属性还蛮新的，到 [2022 年初才在各浏览器中广泛可用](https://developer.mozilla.org/zh-CN/docs/Web/CSS/color-scheme)。

本来以为找到了小众 hack，结果网上一搜才发现这居然就是非常推荐的最佳实践，诸如 [GitHub](https://github.com/)、[Tailwindcss](https://tailwindcss.com/) 等网站都在使用。只能说眼界窄，学得浅了。。。
