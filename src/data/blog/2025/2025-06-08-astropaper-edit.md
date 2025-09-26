---
title: 搬迁至 Astro 使用主题 AstroPaper
desc: 将原博客从 Hugo 搬迁至 Astro，并应用 AstroPaper 主题，然后进行了一些个人改进与优化
slug: astropaper-edit
pubdate: 2025-06-11
categories:
  - Tech 技术
tags:
  - blog
  - astro
---

> [!warning]
> 以下内容已过时。

## UI 部分

大致做了以下修改：

- 参考 [Kalana Kt](https://www.kalanakt.cc/) 博客，在背景底部用一张 PNG 图片来实现噪点填充。
- 将时间显示简化为 YYYY-MM-DD（遵循 ISO 8601 标准）。
- Icon 由 [Tabler](https://tabler.io/icons) 变为 [Remix Icon](https://remixicon.com/)（bangumi 的 icon 来源 iconfont）。

## TOC 组件

原主题中使用 remark 的官方插件 [remark-toc](https://github.com/remarkjs/remark-toc) 自动生成目录，再用第三方插件 [remark-collapse](https://github.com/Rokt33r/remark-collapse) 自动折叠，但是这样无法让读者实时知道在阅读哪个部分，所以还是用 **Claude** 重写了一个 TOC 组件。

### 组件部分

```astro
---
const { headings } = Astro.props;

// 判断传入的是数组还是单个对象
const isHeadingsArray = Array.isArray(headings);
let toc: any[] = [];
let currentHeading = null;

if (isHeadingsArray) {
  // 构建TOC结构
  const parentHeadings = new Map();
  headings.forEach((h) => {
    const headingObj = { ...h, subheadings: [] };
    parentHeadings.set(headingObj.depth, headingObj);
    // Change 2 to 1 if your markdown includes your <h1>
    if (headingObj.depth === 2) {
      toc.push(headingObj);
    } else {
      parentHeadings.get(headingObj.depth - 1).subheadings.push(headingObj);
    }
  });
} else {
  // 单个heading对象
  currentHeading = headings;
}
---

{isHeadingsArray ? (
  <!-- 根组件：渲染整个TOC -->
  <nav class="toc">
    <ul>
      {toc.map((h) => (
        <Astro.self headings={h} />
      ))}
    </ul>
  </nav>
) : (
  <!-- 递归组件：渲染单个heading -->
  <li>
    <a href={'#' + currentHeading.slug}>
      {currentHeading.text}
    </a>
    {currentHeading.subheadings.length > 0 && (
      <ul class="ml-4">
        {currentHeading.subheadings.map((subheading: any) => (
          <Astro.self headings={subheading} />
        ))}
      </ul>
    )}
  </li>
)}
```

上述代码建立了 TOC 基本结构，为了在滑动页面实时高亮当前章节内容，再加入 TS 代码：

``` typescript
<script>
  // 定义一个变量，用于存储当前页面的清理函数
  let cleanup: () => void;

  function initTOCHighlight() {
    // 运行之前，先执行上一个页面的清理函数（如果存在）
    if (cleanup) {
      cleanup();
    }

    const tocLinks = document.querySelectorAll('.toc a[href^="#"]');
    const tocLinksMap = new Map();
    tocLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        tocLinksMap.set(href.slice(1), link);
      }
    });

    const headings = Array.from(document.querySelectorAll('h2, h3, h4, h5, h6'))
      .filter(h => h.id && tocLinksMap.has(h.id));

    if (headings.length === 0 || tocLinksMap.size === 0) return;

    // 使用一个变量来跟踪当前活动的链接，避免不必要的DOM操作
    let currentActiveLink: { classList: { remove: (arg0: string) => void; }; } | null = null;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target.id;
        const link = tocLinksMap.get(id);

        if (entry.isIntersecting && entry.intersectionRatio >= 1) {
          // 移除旧的 active 类
          if (currentActiveLink) {
            currentActiveLink.classList.remove('active');
          }
          // 添加新的 active 类
          link?.classList.add('active');
          currentActiveLink = link;
        }
      });
    }, {
      rootMargin: '-100px 0px -50% 0px',
      threshold: 1.0,
    });

    headings.forEach(heading => observer.observe(heading));

    // 将当前页面的清理逻辑赋值给 cleanup 变量
    // 当下一个页面加载时，这个函数将被调用
    cleanup = () => {
      console.log('Cleaning up observers for the previous page.');
      headings.forEach(heading => observer.unobserve(heading));
      // 或者更彻底地断开连接
      // observer.disconnect();
    };
  }

  // 关键改动：监听 astro:page-load 事件
  // 这会确保在每次页面导航（包括首次加载）后都运行初始化函数
  document.addEventListener('astro:page-load', initTOCHighlight, { once: false });
</script>
```

其中 `rootMargin` 和 `threshold` 可以自行调整。

剩下的就是样式了，为了与 AstroPaper 主题相匹配，我设置了如下样式：

```css
<style>
  .toc a {
    padding: 2px 4px;
    border-radius: 4px;
    transition: all 0.2s ease;
    display: inline-block;
  }

  .toc a:hover {
    color: var(--color-accent);
  }

  /* 当前活跃的heading样式 */
  .toc a.active {
    background-color: var(--color-muted);
  }
</style>
```

当然我是将所有以上内容杂糅到了 `TOC.astro` 一个文件里面。

### 页面展示部分

在 `PostDetails.astro` 中添加如下代码：

``` astro
  //...
  <BackButton />
  //...

  {hasSubHeadings && (

  <!-- 移动端折叠式 TOC -->
  <div class="toc-mobile">
    <details">
      <summary>
        Table of Contents
      </summary>
      <div>
        <TOC headings={headings} />
      </div>
    </details>
  </div>

  <!-- 桌面端贴边 TOC -->
  <div>
    <h3>
      Table of Contents
    </h3>
    <div>
      <TOC headings={headings} />
    </div>
  </div>
  )}

  <main...
```

再加上些 Tailwind 样式：

``` astro
  {hasSubHeadings && (
  <!-- 移动端折叠式 TOC -->
  <div class="toc-mobile xl:hidden mx-auto w-full max-w-4xl px-4 mb-6 mt-4">
    <details class="bg-background rounded-lg p-4 border">
      <summary class="cursor-pointer font-medium text-foreground">
        Table of Contents
      </summary>
      <div class="mt-3">
        <TOC headings={headings} />
      </div>
    </details>
  </div>
  <!-- 桌面端贴边 TOC -->
  <div class="toc-desktop hidden xl:block fixed top-24 right-8 w-64 max-h-[calc(100vh-8rem)] overflow-y-auto z-10">
    <div class="bg-background border rounded-md p-4">
      <h3 class="text-sm font-semibold text-foreground mb-2 pb-2 border-b">
        Table of Contents
      </h3>
      <div class="text-sm">
        <TOC headings={headings} />
      </div>
    </div>
  </div>
  )}
```

就是现在看到的目录了。

> 等有空了还是希望按照 [KLD](https://github.com/kevinleedrum) 的教程：1）[Building a table of contents from Astro's markdown headings](https://kld.dev/building-table-of-contents/) 2）[Table of contents progress animation](https://kld.dev/toc-animation/) 来重新把 TOC 捣鼓的好看些。。。

## 改用 Google Analytics 4 分析访问

请参考博客 [Astro 接入 Google Analytics (Tag Manager)](https://shinya.click/fiddling/astro-google-tag-manager)。
