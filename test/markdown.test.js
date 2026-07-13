import test from 'node:test';
import assert from 'node:assert/strict';

import { toMarkdown } from '../src/markdown.js';

test('toMarkdown renders metadata, diagnostics, and body', () => {
  const markdown = toMarkdown({
    url: 'https://mp.weixin.qq.com/s/example',
    method: 'ocr',
    title: '测试标题',
    account: '测试公众号',
    publishTime: '2026-06-25',
    text: '第一段\n\n第二段',
    diagnostic: {
      status: 'ok',
      reason: 'OCR 兜底识别成功',
      score: 7
    },
    artifacts: ['screenshots/page-001.png']
  });

  assert.match(markdown, /^# 测试标题/m);
  assert.match(markdown, /公众号：测试公众号/);
  assert.match(markdown, /获取方式：ocr/);
  assert.match(markdown, /诊断：ok - OCR 兜底识别成功/);
  assert.match(markdown, /screenshots\/page-001\.png/);
  assert.match(markdown, /第一段\n\n第二段/);
});
