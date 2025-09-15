---
title: "在博客中更换中文字体"
desc: "接上文，不怎么优雅地完成了在博客中更换中文字体"
slug: change-chinese-fonts-in-blog
pubdate: 2025-09-11
categories:
  - Tech 技术
tags:
  - blog
  - astro
  - font
---

在 [前一篇文章](../astro-paged) 中我痛苦地放弃了自定义博客中文字体，依旧不死心，今天又重新尝试了一下，一通乱捣鼓居然成功了，虽然过程不是很优雅，但好歹将就能用了，现把流程记录如下：

## 分割字体

首先找到你想使用的字体源文件（ttf、otf），然后利用 [cn-font-split 在线分包](https://chinese-font.netlify.app/zh-cn/online-split/) ，你会得到 `result.css`（后续要引入的文件）和一堆 `.woff2` 文件，具体运行原理可以参考 [相关文档](https://chinese-font.netlify.app/zh-cn/post/cn_font_split_design)。

## 字体文件部署

中文网字计划推荐是部署在 OSS 上再套一层 CDN 边缘加速，那我直接选用了大善人 Cloudflare 的 R2 对象存储（我把个人博客也部署在 Cloudflare Pages，远程图床也在 R2 桶里，所以直接一条龙了）。

1. 创建新桶，我命名为 fonts，把刚才分包的文件夹整个上传到桶里。

   > [!note]
   >
   > 分包出来的小文件非常多，基本确定超出 Cloudflare 网页端上传数量上限。由于 R2 兼容 S3 API，这里建议下载 [AWS CLI](https://aws.amazon.com/cn/cli/)（方便点直接使用包管理工具，macOS 用 `brew`，Windows 用 `scoop`），用命令行可以很简单的批量上传文件。
   >
   > ```sh
   > aws s3 sync ~/Downloads/ChillKai s3://fonts/ChillKai --endpoint-url https://yourown.r2.cloudflarestorage.com/
   > ```
   >
   > 有几个点注意一下，`sync` 后面跟着的是你的分包后字体文件夹，`s3://` 后跟的是你的桶名和你想把那一堆小文件放在的文件夹名，最后的 S3 API 自行去桶的 Settings --> General 中查看，最后的 `/桶名` 记得去掉。

   由于字体文件有较强的版权属性，还需要在桶的 Settings-->CORS Policy 添加如下代码：

   ```json
   [
     {
       "AllowedOrigins": [
         "XXXXXXX",  //你的博客域名
         "http://localhost:XXXX"  //如果需要本地调试可以添加
       ],
       "AllowedMethods": [
         "GET",
         "HEAD"
       ],
       "AllowedHeaders": [
         "*"
       ],
       "MaxAgeSeconds": 86400
     }
   ]
   ```

2. 在 Cloudflare 左侧导航栏找到 Compute (Workers)，新建一个 Worker，选择最简单的 Hello World 模板，创建成功后在 BINDING-->Add binding-->选择 R2 bucket-->Variable name 填 FONT_BUCKET，R2 bucket 选择 fonts-->最后编辑代码如下：

   ```js
   export default {
     async fetch(request, env, ctx) {
       const url = new URL(request.url);
       const path = url.pathname.slice(1); // 移除开头的 /
       
       // 处理 OPTIONS 请求
       if (request.method === 'OPTIONS') {
         return new Response(null, {
           headers: {
             'Access-Control-Allow-Origin': '*',
             'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
             'Access-Control-Allow-Headers': '*',
           }
         });
       }
       
       try {
         // 直接从 R2 bucket 获取
         const object = await env.FONT_BUCKET.get(path);
         
         if (!object) {
           return new Response('Font not found', { status: 404 });
         }
         
         // 设置响应头
         const headers = new Headers();
         headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
         headers.set('Cache-Control', 'public, max-age=31536000, immutable');
         headers.set('Access-Control-Allow-Origin', '*');
         headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
         headers.set('ETag', object.httpEtag);
         
         return new Response(object.body, { headers });
         
       } catch (error) {
         console.error('Error:', error);
         return new Response('Internal Server Error', { status: 500 });
       }
     }
   };
   ```

3. 绑定自定义域名，在 Settings-->Domains & Routes 里添加 Custom domain，像我就添加了 `fonts.zeratulqiu.me`，注意这一步的前提是你的域名本身是在 Cloudflare 里且 DNS 由 Cloudflare 管理的。如果没有那就只能去拿 R2 桶的公共访问 URL 来进行后续操作了。

## 博客代码添加

在 head 里添加 `<link rel="stylesheet" href="https://fonts.zeratulqiu.me/ChillKai/result.css" />`，要想优化一下还可以在前面再添加一行 `<link rel="preconnect" href="https://fonts.zeratulqiu.me" crossorigin>` 预链接。不建议在 css 文件中使用 `@import url("https://fonts.zeratulqiu.me/ChillKai/result.css");` 方式加载，这样是串行加载，会造成阻塞。

至此算是大功告成！应该可以看到字体加载成功了。
