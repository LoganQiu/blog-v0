---
title: "写代码使用的相关工具"
desc: ""
slug: tools-i-use-for-code
pubdate: 2025-09-22
categories:
  - Tools 工具
tags:
  - terminal
  - font
---

> 就当是存个档，以后要是不写代码了也有个念想。

## 字体

不管用什么工具，一直看着的字体是最重要的，[FiraCode](https://github.com/tonsky/FiraCode) 始终是我的首选，不过不着急下载，一般为了终端美化都推荐去下载对应的集成了大量 icons 的 [Nerd Fonts](https://www.nerdfonts.com/)。

由于写注释时可能使用中文，曾经有强迫症的我一直在找中英文字宽完美 2:1 的字体。[更纱黑体](https://github.com/be5invis/Sarasa-Gothic) 是第一款我找到符合要求的字体，效果可以在 [这里](https://picaq.github.io/sarasa/) 查看，它结合了拉丁字母部分的 Iosevka 以及 CJK 部分的 Source Han Sans 并在字重、字宽等方面做了精心匹配，使混排较为美观。但使用一阵后感觉英文字母过于细窄，长时间注视容易感到疲劳，遂放弃。

后来找到了令人惊艳的 [Maple Mono](https://github.com/subframe7536/maple-font)。顶级优秀的制作，丰富特性支持，依然完美的中英文 2:1 等宽，多少溢美之词都不为过，详细内容可以在其官网：<https://font.subf.dev/zh-cn/> 查看。（于我个人而言唯一的缺点就是过于圆润）

```bash
brew install font-fira-code-nerd-font
// 更纱黑体无 nf 版本
brew install font-sarasa-gothic
// maple mono 有众多版本可以选择，我挑选了相对最全面的一款
brew install font-maple-mono-nf-cn
```

> 上面都是编程字体，既然讲了就顺稍提一下文档使用字体，自己写文章时使用合适字体着实令人心情愉悦。
> 中文首推是 [lxgw](https://github.com/lxgw) 的 [霞鹜文楷](https://github.com/lxgw/LxgwWenKai)，其实落霞孤鹜发行了许多字体，不过就这个比较出名。
> 然后是 [特里王](https://www.zhihu.com/people/wang-ting-rui-61) 的京華老宋体长期作为我的微信读书字体。
> 英文方面我的选择是 [Libertinus](https://github.com/alerque/libertinus)，这款字体于 2012 年从 Linux Libertine 分支而来，并且支持了完整的家族字体（四种主要 sans/serif/mono/math，三种派生 Serif Display/Serif Initials/Keyboard）。

## IDE

其实没什么好选的，时至今日 [VSCode](https://code.visualstudio.com/)（好吧严谨些这是代码编辑器不是 IDE）仍是最佳的选择（[Cursor](https://cursor.com/) 我并不看好未来，终究只是一个套壳，优势已然荡然无存）。[Neovim](https://github.com/neovim/neovim) 还是让高手去耍吧。。。JetBrains 不错，但是在 AI 赛道上的落后以及昂贵的订阅费使人望而却步（不过旗下越来越多 IDE 支持非商业免费使用，大赞）。

我个人在编写简单的前端或者 Go 代码时更多使用 [Zed](https://github.com/zed-industries/zed)，它有更精致硬朗的 UI 以及极致的响应速度。

> Vibe Coding 大行其道的当下，[Claude Code](https://github.com/anthropics/claude-code)、[Codex](https://github.com/openai/codex)、[Gemini CLI](https://github.com/google-gemini/gemini-cli) 等等 AI Agent 都支持直接在终端运行，所以想选啥似乎都无所谓了。

## 文档编辑器

这里基本就是指写 Markdown 文件了，除了 VSCode 之外最常见的就是 [Typora](https://typoraio.cn/)（买断制挺好用）。像 [Obsidian](https://obsidian.md/) 我其实并不喜欢，它的主要功能是构建一个本地知识库，你要充分使用势必会破坏原生的 `.md` 格式。在 macOS 上还有个 [妙言](https://github.com/tw93/MiaoYan) 可以试试，相对小众一些但是原生应用性能优异，并且可以巧妙地当作 PPT 来展示。

## Terminal && Shell

macOS：iTerm2 + zsh

Windows：Windows Terminal + PowerShell

由于我不在 shell 上搞些什么脚本，尽管不统一也并不影响使用。
