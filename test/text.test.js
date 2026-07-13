import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDiagnostic,
  isTextUseful,
  normalizeText,
  scoreExtraction
} from '../src/text.js';

test('normalizeText trims blank lines and preserves paragraph breaks', () => {
  const input = '  第一段\n\n\n 第二段  \t  内容\r\n\r\n第三段 ';

  assert.equal(normalizeText(input), '第一段\n\n第二段内容\n\n第三段');
});

test('normalizeText removes OCR spaces between Chinese characters', () => {
  const input = '这 是 一 段 用 于 验证 OCR 的 中 文 正 文 。';

  assert.equal(normalizeText(input), '这是一段用于验证 OCR 的中文正文。');
});

test('isTextUseful rejects short navigation-like text', () => {
  assert.equal(isTextUseful('微信公众平台\\n继续访问'), false);
});

test('isTextUseful accepts article-like Chinese text', () => {
  const text = '这是公众号文章正文。'.repeat(80);

  assert.equal(isTextUseful(text), true);
});

test('scoreExtraction grades useful metadata and text higher than partial output', () => {
  const full = scoreExtraction({
    title: '一篇文章',
    account: '测试公众号',
    publishTime: '2026-06-25',
    text: '这是正文内容。'.repeat(120)
  });
  const partial = scoreExtraction({
    title: '一篇文章',
    account: '',
    publishTime: '',
    text: '太短'
  });

  assert.equal(full.useful, true);
  assert.equal(partial.useful, false);
  assert.ok(full.score > partial.score);
});

test('buildDiagnostic explains likely login pages', () => {
  const diagnostic = buildDiagnostic({
    url: 'https://mp.weixin.qq.com/s/example',
    method: 'browser-dom',
    title: '',
    account: '',
    publishTime: '',
    text: '请在微信客户端打开链接，需要登录后继续访问'
  });

  assert.equal(diagnostic.status, 'failed');
  assert.equal(diagnostic.reason, '页面疑似要求登录或在微信客户端打开');
});
