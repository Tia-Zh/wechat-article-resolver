---
name: wechat-article-resolver
description: Use when a user provides a WeChat Official Account article URL and the assistant's built-in web reading fails, returns only navigation/button text, or returns obviously incomplete article content. The skill calls a local browser-based resolver to extract the article into Markdown, then continues the user's original task with the extracted content.
---

# WeChat Article Resolver

Use this skill as a fallback for WeChat Official Account article links.

## When to Use

Use this skill when all are true:

1. The user provided a `https://mp.weixin.qq.com/s/...` link.
2. The current task needs the article content.
3. Your normal web-reading method fails, returns an error, returns only page chrome/button text, or returns content that is clearly incomplete.

Do not use this skill if your native web-reading method already retrieved the full article content.

## What This Skill Does

This skill calls the local `wechat-article-resolver` tool. The tool:

1. Opens the WeChat article in a real Chromium browser through Playwright.
2. Waits for the page to load and scrolls it.
3. Tries to extract title, account name, publish time, and body text from the DOM.
4. If DOM text is missing or too short, captures a full-page screenshot.
5. Runs OCR on the screenshot.
6. Writes a Markdown file with metadata, body text, artifacts, and diagnostics.

## Required Local Tool

The repository must be installed locally first:

```powershell
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

If the tool is not installed, tell the user that local installation is required because this fallback depends on launching a real browser on the user's machine.

## How to Call

From the `wechat-article-resolver` repository directory:

```powershell
.\resolve-wechat.cmd "https://mp.weixin.qq.com/s/ARTICLE_ID"
```

By default, the result is written to:

```text
outputs/wechat-article.md
```

For a custom output path:

```powershell
.\resolve-wechat.cmd "https://mp.weixin.qq.com/s/ARTICLE_ID" "outputs/article.md"
```

## After Calling

1. Read the Markdown output.
2. Check the diagnostic line:
   - `ok`: use the extracted article content directly.
   - `partial`: continue only if enough content was extracted; mention that the extraction may need review.
   - `failed`: report the reason and ask the user for another source, a screenshot, or pasted text.
3. Continue the user's original task. Do not assume the output should be a "小作文"; follow the user's request.

## Boundaries

- Do not bypass login, CAPTCHA, paywalls, permissions, or platform restrictions.
- Do not perform bulk scraping unless the user has explicit permission and a clear compliant purpose.
- Use OCR only as a fallback; OCR output may contain recognition errors.
