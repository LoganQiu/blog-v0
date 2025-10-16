---
title: "设置 Cloudflare R2 图床"
desc: "继续感谢 Cloudflare，我把博客图床放在了 R2 桶里，然后额外做了些措施防止被盗刷流量。"
slug: image-hosting
pubdate: 2025-10-09
categories:
  - Tech 技术
tags:
  - blog
  - image
  - cloudflare
---

> 写的有点乱，搞不定可以邮件联系。

## 创建桶和 API 令牌

在 Cloudflare 面板左侧导航栏找到 R2 对象存储，直接创建新桶，然后右上角创建 API 令牌，务必记下 Access key id 和 Access key secret，那么现在你就可以直接初步使用了（把桶变成公开状态）。

部署 R2 图床非常容易，但是需要注意稍有不慎便可能被盗刷巨额流量，一夜之间背上巨大债务😭。

为了防止出现这种情况，我们可以需要用一些方法尽可能阻止被刷。

## Workers 防盗链

将刚创建的桶保持私有，然后左侧选“计算和 AI”，新建 Workers，绑定 R2 桶，名称“IMG_BUCKET”，值为对应的存储桶，再修改代码：

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const pathname = url.pathname.replace(/^\//, "") // 去掉最前面的斜杠

    // 1️⃣ 从 R2 获取对象
    const object = await env.IMG_BUCKET.get(pathname)
    if (!object) {
      return new Response("404 Not Found", { status: 404 })
    }

    // 2️⃣ 防盗链检查
    const referer = request.headers.get("Referer") || ""
    const allowedReferers = [
      "https://zeratulqiu.me",
      "https://memos.zeratulqiu.me",
      "http://localhost",
      "https://localhost",
      "file://", // Typora、PicList 本地预览
    ]
    const isAllowed =
      referer === "" ||
      allowedReferers.some((domain) => referer.startsWith(domain))
    if (!isAllowed) {
      return new Response("403 Forbidden", { status: 403 })
    }

    // 3️⃣ 生成响应头
    const headers = new Headers()
    headers.set(
      "Content-Type",
      object.httpMetadata?.contentType ||
        guessContentType(pathname) ||
        "application/octet-stream"
    )
    headers.set("Cache-Control", "public, max-age=31536000, immutable") // 1 年
    headers.set("Access-Control-Allow-Origin", "*") // 图床可以开放
    headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")

    return new Response(object.body, { headers })
  },
}

// 辅助函数：推断文件类型
function guessContentType(filename) {
  const ext = filename.split(".").pop().toLowerCase()
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg"
    case "png":
      return "image/png"
    case "webp":
      return "image/webp"
    case "avif":
      return "image/avif"
    case "gif":
      return "image/gif"
    case "svg":
      return "image/svg+xml"
    case "mp4":
      return "video/mp4"
    case "mp3":
      return "audio/mpeg"
    case "pdf":
      return "application/pdf"
    default:
      return null
  }
}
```

点击部署，到设置里可以自定义域名，就很方便的可以使用图床链接了。

## 便捷上传图片

不能总是手动把图片拖进存储桶里吧，可以使用一些第三方工具，比较流行的是 [PicGo](https://github.com/Molunerfinn/PicGo)，不过已经几年没有版本更新了，我选择它的继任者 [PicList](https://github.com/Kuingsmile/PicList)，有更丰富的功能（可以图片预处理）和完善的界面。

选择添加 AWS S3 图床，里面填入上面记录的各种参数就大功告成。

## 额外优化

1. Cloudflare 中选择你的域名，进入左侧导航栏的 Cache-->Cache Rules，新建一个规则，自定义筛选表达式 `(http.host eq "yourcustomdomain.com")`，边缘 TTL 直接强制使用此处设定，建议 1 个月，浏览器 TTL 同理，建议设置 1 年。

2. 同样找到在左侧的安全性-->安全规则，新建自定义规则，输入表达式 `(http.referer ne "" and not http.referer contains "yourdomain.com")`，执行操作 block。

3. 新建速率限制规则，输入表达式 `(http.host in {"yourcustomdomain.com"})`，后面阈值可以自行设置，比如 10 秒内请求超过 20 次，封禁 1 分钟。
