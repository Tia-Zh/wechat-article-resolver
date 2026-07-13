# WeChat Article Resolver

一个本地微信公众号文章链接解析工具。

它不是通用爬虫，也不是 prompt。它的用途是：当 AI 自带网页读取能力无法读取微信公众号文章正文时，在用户本机启动真实浏览器，打开文章页面，提取正文，并输出 Markdown，供 AI 继续完成原本任务。

## 适用场景

适合：

- AI 直接读取 `mp.weixin.qq.com` 链接失败；
- AI 只读到按钮、导航、底部文字，没拿到正文；
- AI 读取到的正文明显不完整；
- 用户希望 AI 继续基于公众号正文做摘要、分析、改写、日报、周报或其他原本任务。

不适合：

- 绕过登录、验证码、权限控制或平台限制；
- 未经授权的大规模批量抓取；
- 普通网页聊天 AI 无法访问本机命令行的场景。

## 工作逻辑

```text
微信公众号文章链接
↓
先让 AI 自带网页读取能力尝试读取
↓
如果 AI 已经能完整读取正文，就不用本工具
↓
如果 AI 读不到或读不完整
↓
调用本地 wechat-article-resolver
↓
Playwright 打开真实 Chromium 浏览器页面
↓
等待加载 + 自动滚动
↓
优先从 DOM 提取标题/公众号/发布时间/正文
↓
如果 DOM 正文为空或太短
↓
自动截长图并 OCR
↓
输出 Markdown + 成功/失败诊断
↓
AI 读取 Markdown，继续用户原本任务
```

## 安装

要求本机已安装 Node.js。

Windows 推荐让 AI 或用户运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

这会执行：

```powershell
npm.cmd install
npx.cmd playwright install chromium
```

## 运行

```powershell
.\resolve-wechat.cmd "https://mp.weixin.qq.com/s/ARTICLE_ID"
```

默认输出：

```text
outputs/wechat-article.md
```

指定输出：

```powershell
.\resolve-wechat.cmd "https://mp.weixin.qq.com/s/ARTICLE_ID" "outputs/article.md"
```

显示浏览器窗口，方便调试：

```powershell
npm.cmd run resolve -- "https://mp.weixin.qq.com/s/ARTICLE_ID" --headed
```

只测试 DOM，不跑 OCR：

```powershell
npm.cmd run resolve -- "https://mp.weixin.qq.com/s/ARTICLE_ID" --no-ocr
```

## 给 AI 的推荐指令

可以把 `AI_INSTALL_PROMPT.md` 里的内容发给支持本机命令行的 AI。

核心意思是：

```text
以后遇到微信公众号文章链接时，先用你自己的网页读取能力读。
如果能读完整正文，就继续原任务。
如果读不到或读不完整，再调用本地 wechat-article-resolver。
读取工具输出的 Markdown 后，继续用户原本任务。
```

## Skill

仓库里提供了一个 Codex 风格的 skill 草案：

```text
skills/wechat-article-resolver/SKILL.md
```

这个 skill 的作用不是替代工具，而是告诉 AI：

- 什么时候应该调用本工具；
- 调用失败时怎么处理；
- 成功后如何继续原任务。

## 输出内容

Markdown 输出包含：

- 标题；
- 公众号；
- 发布时间；
- 原文链接；
- 获取方式：`browser-dom` 或 `ocr`；
- 诊断状态：`ok`、`partial`、`failed`；
- 诊断原因；
- 截图路径；
- 正文。

## 边界

- 只处理浏览器能正常访问的页面；
- 不绕过登录、验证码、权限控制或平台反爬；
- OCR 是兜底方案，可能有错字，需要抽查；
- 短文本可能会被标记为 `partial`，因为工具无法确认它是不是完整正文。

