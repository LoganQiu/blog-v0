---
title: 通用代理平台
desc: 介绍目前较为流行的代理平台以及对应的客户端
slug: proxy-platform
pubdate: 2023-09-23
moddate: 2024-02-18
categories:
  - Tech 技术
tags:
  - proxy
---

## Clash

### 总体介绍

> 本页内容许多已被删除，可以前往 [Internet Archive](https://archive.org/) 找到历史痕迹。
> 由于事件始于 2023/11/02 [@Fndroid](https://github.com/Fndroid) 删库，所以网页快照请选择此时间之前。

| 内核                | 开发者 & 网址                                           | 仓库状态 | 备注                                                                                                                                                                 |
| ------------------- | ------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Clash               | [Dreamacro/clash](https://github.com/Dreamacro/clash)   | 已删除   | 由于出现对 Clash 的不当使用和重新分发，团队分支出一个有更高级功能的闭源版本 [Premium](https://github.com/Dreamacro/clash/releases/tag/premium)（使用最广，已删除）。 |
| Clash.Meta (mihomo) | [MetaCubeX/mihomo](https://github.com/MetaCubeX/mihomo) | 正常     | 基于 Clash 重写项目，弃用 main 分支，Alpha 分支为最新提交分支，Meta 分支每隔一段时间合并 Alpha 分支的代码。                                                          |
| Clash-rs            | [Watfaq/clash-rs](https://github.com/Watfaq/clash-rs)   | 正常     | 使用 Rust 重写，使用范围较小。                                                                                                                                       |

### 特点概述

参考：<https://dreamacro.github.io/clash/>

- 入站连接支持：HTTP，HTTPS，SOCKS5 服务端，TUN 设备\*
- 出站连接支持：Shadowsocks(R)，VMess，Trojan，Snell，SOCKS5，HTTP(S)，Wireguard\*
- 基于规则的路由：动态脚本、域名、IP 地址、进程名称和更多\*
- Fake-IP DNS：尽量减少 DNS 污染的影响，提高网络性能
- 透明代理：使用自动路由表/规则管理 Redirect TCP 和 TProxy TCP/UDP\*
- Proxy Groups 策略组：自动化的可用性测试（fallback）、负载均衡（load balance）或延迟测试（url-test）
- 远程 Providers：动态加载远程代理列表
- RESTful API：通过一个全面的 API 就地更新配置

\*: 只在 Premium 版本中提供.

参考：<https://clash-meta.gitbook.io/clash.meta-wiki-old-1>

Meta 内核新特性出站连接支持：VLESS XTLS/Trojan XTLS/Hysteria

### 仓库现状

参考 [gfw-report 关于 Clash 事件评论](https://github.com/net4people/bbs/issues/303)，剔除部分较少 Star 仓库并根据现在实际情况重新整理表格：

| 项目名称          | 开发者 & 网址                                                                     | 仓库状态                                                                                                                             |
| ----------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Clash For Windows | [Fndroid/clash_for_windows_pkg](https://github.com/Fndroid/clash_for_windows_pkg) | 已删除                                                                                                                               |
| clash-dashboard   | [Dreamacro/clash-dashboard](https://github.com/Dreamacro/clash-dashboard)         | 已删除                                                                                                                               |
| ClashForAndroid   | [Kr328/ClashForAndroid](https://github.com/Kr328/ClashForAndroid)                 | 已删除，已从 Google Play 移除                                                                                                        |
| ClashX            | [yichengchen/clashX](https://github.com/yichengchen/clashX)                       | 已删除 + 在 [AppCenter](https://install.appcenter.ms/users/clashx/apps/clashx-pro/distribution_groups/public) 的 ClashX Pro 也已删除 |
| Fclash            | [Fclash/Fclash](https://github.com/Fclash/Fclash)                                 | 已删除，作者已注销账号                                                                                                               |
| Clash Verge       | [zzzgydi/clash-verge](https://github.com/zzzgydi/clash-verge)                     | 已存档 + 设置 `rm` 为默认分支（使用 Clash.Meta）                                                                                     |
| yacd              | [haishanh/yacd](https://github.com/haishanh/yacd)                                 | 已停更                                                                                                                               |

接手 Clash.Meta 开发的 [@MetaCubeX](https://github.com/MetaCubeX) fork 了许多仓库将内核替换后继续更新：

| 项目名称            | 网址                                                                              | Fork 来源                                                                 |
| ------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| ClashX.Meta         | [MetaCubeX/ClashX.Meta](https://github.com/MetaCubeX/ClashX.Meta)                 | [alvincrisuy/clashX](https://github.com/alvincrisuy/clashX)               |
| Yacd-meta           | [MetaCubeX/Yacd-meta](https://github.com/MetaCubeX/Yacd-meta)                     | [haishanh/yacd](https://github.com/haishanh/yacd)                         |
| ClashMetaForAndroid | [MetaCubeX/ClashMetaForAndroid](https://github.com/MetaCubeX/ClashMetaForAndroid) | [xuhaoyang/ClashForAndroid](https://github.com/xuhaoyang/ClashForAndroid) |
| metacubexd          | [MetaCubeX/metacubexd](https://github.com/MetaCubeX/metacubexd)                   | 无，独立开发的面板                                                        |

> 同样受 2023/11/02 事件影响，[TUIC](https://github.com/EAimTY/tuic) 作者 [@EAimTY](https://github.com/EAimTY) 因对开源社区失望而删库（原因详见 [EAimTY 博客文章--基于荷尔蒙开发的开源项目](https://www.eaimty.com/2023/opensource-project-based-on-hormone/)）。

仍然或重新开始正常更新的仓库（自然都使用 Clash.Meta 内核）：

| 项目名称        | 开发者 & 网址                                                | 备注                                                         |
| --------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| clash-nyanpasu  | [LibNyanpasu/clash-nyanpasu](https://github.com/LibNyanpasu/clash-nyanpasu) | 基于 Clash.Meta & Clash-rs，由 Clash Verge 1.3.7 分支而来    |
| Clash Verge Rev | [clash-verge-rev/clash-verge-rev](https://github.com/clash-verge-rev/clash-verge-rev) | 明确表明是 [Clash Verge](https://github.com/zzzgydi/clash-verge) 的继任者（使用 Clash.Meta） |
| ShellClash      | [juewuy/ShellClash](https://github.com/juewuy/ShellClash)    | 重命名为 `ShellCrash` + 改用 Clash.Meta 和 sing-box          |
| FlClash         | [chen08209/FlClash](https://github.com/chen08209/FlClash)    | 全平台嗷全平台（除了 iOS）                                   |
| Mihomo Party    | [pompurin404/mihomo-party](https://github.com/pompurin404/mihomo-party) | 不推荐，v1.5.12 之后被出售给某机场团队                       |
| Sparkle         | [xishang0128/sparkle](https://github.com/xishang0128/sparkle) | Mihomo Party 商业化后分支而来，更稳定                        |
| GUI.for.Clash   | [GUI-for-Cores/GUI.for.Clash](https://github.com/GUI-for-Cores/GUI.for.Clash) |                                                              |

## sing-box

官网：<https://sing-box.sagernet.org/>

仓库地址：<https://github.com/SagerNet/sing-box>

与 Clash 不同，sing-box 自带 Android 以及 Apple 平台图形化客户端，Windows 客户端施工中。

官方并不赞成第三方项目使用 sing-box，此处仅作列表：

| 项目名称               | 开发者 & 网址                                                | 备注                                                         |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| NekoBox For Android    | [MatsuriDayo/NekoBoxForAndroid](https://github.com/MatsuriDayo/NekoBoxForAndroid) |                                                              |
| NekoBox For PC/nekoray | [MatsuriDayo/nekoray](https://github.com/MatsuriDayo/nekoray) | 已存档，不支持 Xray Core                                     |
| Hiddify                | [hiddify/hiddify-next](https://github.com/hiddify/hiddify-next) |                                                              |
| GUI.for.SingBox        | [GUI-for-Cores/GUI.for.SingBox](https://github.com/GUI-for-Cores/GUI.for.SingBox) |                                                              |
| Karing                 | [KaringX/karing](https://github.com/KaringX/karing)          |                                                              |
| CatBoxForAndroid       | [AntiNeko/CatBoxForAndroid](https://github.com/AntiNeko/CatBoxForAndroid) | 已删除，由 NekoBox For Android 分支                          |
| husi（虎兕）           | [xchacha20-poly1305/husi](https://github.com/xchacha20-poly1305/husi) |                                                              |
| Exclave                | [dyhkwong/Exclave](https://github.com/dyhkwong/Exclave)      | 由已存档项目 [SagerNet](https://github.com/SagerNet/SagerNet) fork 而来 |

## V2Ray

官网：<https://www.v2fly.org/>

仓库地址：<https://github.com/v2fly/v2ray-core>

V2Ray 没有官方 GUI 客户端。

| 项目名称 | 开发者 & 网址                                     | 备注                                                                                                     |
| -------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| v2rayN   | [2dust/v2rayN](https://github.com/2dust/v2rayN)   | 支持桌面端全平台，支持 [几乎所有协议内核](https://github.com/2dust/v2rayN/wiki/List-of-supported-cores)  |
| v2rayNG  | [2dust/v2rayNG](https://github.com/2dust/v2rayNG) | 支持 [Xray core](https://github.com/XTLS/Xray-core) 和 [v2fly core](https://github.com/v2fly/v2ray-core) |
| V2rayU   | [yanue/V2rayU](https://github.com/yanue/V2rayU)   | 默认切换到 `rm` 分支，`main` 分支偶有更新                                                                |
