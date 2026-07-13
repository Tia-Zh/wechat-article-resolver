import { chromium } from 'playwright';

import { normalizeText } from './text.js';

const WECHAT_MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
  '(KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.49 NetType/WIFI Language/zh_CN';

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0;
      const distance = Math.max(300, Math.floor(window.innerHeight * 0.75));
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        total += distance;

        if (total >= document.body.scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 350);
    });
  });
}

async function evaluateWechatPage(page) {
  return page.evaluate(() => {
    const pickText = (selectors) => {
      for (const selector of selectors) {
        const node = document.querySelector(selector);
        const text = node?.innerText || node?.textContent || node?.content || '';
        if (text.trim()) return text.trim();
      }
      return '';
    };

    const pickMeta = (names) => {
      for (const name of names) {
        const node =
          document.querySelector(`meta[property="${name}"]`) ||
          document.querySelector(`meta[name="${name}"]`);
        const text = node?.getAttribute('content') || '';
        if (text.trim()) return text.trim();
      }
      return '';
    };

    const bodyText = document.body?.innerText || '';
    const publishMatch =
      bodyText.match(/\d{4}年\d{1,2}月\d{1,2}日/) ||
      bodyText.match(/\d{4}-\d{1,2}-\d{1,2}/);

    const title =
      pickText(['#activity-name', 'h1.rich_media_title', 'h1']) ||
      pickMeta(['og:title', 'twitter:title']);
    const account =
      pickText(['#js_name', '.rich_media_meta_nickname', '#profileBt']) ||
      pickMeta(['author']);
    const publishTime =
      pickText(['#publish_time', '#js_publish_time']) ||
      (publishMatch ? publishMatch[0] : '');
    const content =
      pickText(['#js_content', '.rich_media_content', 'article']) ||
      bodyText;

    return {
      title,
      account,
      publishTime,
      text: content,
      pageTitle: document.title,
      finalUrl: location.href
    };
  });
}

export async function extractWithBrowser(url, options = {}) {
  const browser = await chromium.launch({
    headless: options.headed ? false : true
  });

  try {
    const context = await browser.newContext({
      userAgent: WECHAT_MOBILE_UA,
      viewport: { width: 390, height: 844 },
      isMobile: true,
      locale: 'zh-CN'
    });
    const page = await context.newPage();

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: options.timeoutMs ?? 45000
    });
    await page.waitForTimeout(options.settleMs ?? 3000);
    await autoScroll(page);
    await page.waitForTimeout(800);

    const extracted = await evaluateWechatPage(page);

    return {
      ...extracted,
      url,
      method: 'browser-dom',
      title: normalizeText(extracted.title),
      account: normalizeText(extracted.account),
      publishTime: normalizeText(extracted.publishTime),
      text: normalizeText(extracted.text),
      page,
      browser
    };
  } catch (error) {
    return {
      url,
      method: 'browser-dom',
      title: '',
      account: '',
      publishTime: '',
      text: '',
      error: error instanceof Error ? error.message : String(error),
      page: null,
      browser
    };
  } finally {
    if (!options.keepBrowserOpen) {
      await browser.close();
    }
  }
}

export async function capturePageScreenshot(page, screenshotPath) {
  if (!page) {
    return null;
  }

  await page.screenshot({
    path: screenshotPath,
    fullPage: true
  });

  return screenshotPath;
}
