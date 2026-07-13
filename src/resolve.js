#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

import { extractWithBrowser } from './browserExtract.js';
import { toMarkdown } from './markdown.js';
import { runOcr } from './ocr.js';
import { buildDiagnostic, isTextUseful, normalizeText } from './text.js';

function parseArgs(argv) {
  const args = {
    url: '',
    out: '',
    noOcr: false,
    headed: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (item === '--out') {
      args.out = argv[index + 1] ?? '';
      index += 1;
    } else if (item === '--no-ocr') {
      args.noOcr = true;
    } else if (item === '--headed') {
      args.headed = true;
    } else if (!args.url) {
      args.url = item;
    }
  }

  return args;
}

function defaultOutputPath() {
  return path.resolve(process.cwd(), 'outputs', 'wechat-article.md');
}

function artifactDirectory() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.resolve(process.cwd(), 'outputs', `wechat-resolver-artifacts-${stamp}`);
}

async function ensureParent(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.url) {
    console.error('Usage: npm.cmd run resolve -- "https://mp.weixin.qq.com/..." [--out result.md] [--no-ocr] [--headed]');
    process.exitCode = 2;
    return;
  }

  const outputPath = path.resolve(args.out || defaultOutputPath());
  const artifactDir = artifactDirectory();
  await fs.mkdir(artifactDir, { recursive: true });

  console.log(`[1/3] Opening page with browser automation: ${args.url}`);
  const browserResult = await extractWithBrowser(args.url, {
    headed: args.headed,
    keepBrowserOpen: true
  });
  const artifacts = [];
  let bestResult = {
    ...browserResult,
    diagnostic: buildDiagnostic(browserResult)
  };

  const domTextUseful = isTextUseful(browserResult.text);

  if (!domTextUseful && !args.noOcr) {
    console.log('[2/3] DOM text is weak; capturing screenshot and running OCR...');
    const screenshotPath = path.join(artifactDir, 'page-full.png');

    if (browserResult.page) {
      await browserResult.page.screenshot({ path: screenshotPath, fullPage: true });
      artifacts.push(screenshotPath);

      try {
        const ocrText = await runOcr(screenshotPath);
        const ocrResult = {
          ...browserResult,
          method: 'ocr',
          text: normalizeText(ocrText)
        };

        bestResult = {
          ...ocrResult,
          diagnostic: buildDiagnostic(ocrResult)
        };
      } catch (error) {
        bestResult = {
          ...browserResult,
          diagnostic: {
            status: 'partial',
            reason: `OCR 执行失败：${error instanceof Error ? error.message : String(error)}`,
            score: bestResult.diagnostic.score,
            textLength: bestResult.diagnostic.textLength
          }
        };
      }
    } else {
      console.log('[2/3] Browser page was unavailable; OCR skipped.');
    }
  } else if (domTextUseful) {
    console.log('[2/3] DOM extraction produced useful text; OCR skipped.');
  } else {
    console.log('[2/3] DOM extraction is weak, but OCR is disabled.');
  }

  await browserResult.browser?.close();

  console.log(`[3/3] Writing Markdown: ${outputPath}`);
  await ensureParent(outputPath);
  await fs.writeFile(
    outputPath,
    toMarkdown({
      ...bestResult,
      artifacts
    }),
    'utf8'
  );

  console.log(`Status: ${bestResult.diagnostic.status}`);
  console.log(`Reason: ${bestResult.diagnostic.reason}`);
  console.log(`Output: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
