export function normalizeText(value) {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/([\u4e00-\u9fff])[^\S\r\n]+(?=[\u4e00-\u9fff，。！？；：、])/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function isTextUseful(value) {
  const text = normalizeText(value);
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) ?? []).length;
  const navigationSignals = [
    '继续访问',
    '需要登录',
    '请在微信客户端打开',
    '环境异常',
    '访问频繁'
  ].filter((signal) => text.includes(signal)).length;

  if (navigationSignals >= 2) {
    return false;
  }

  return text.length >= 500 || chineseChars >= 180;
}

export function scoreExtraction(result) {
  const text = normalizeText(result.text);
  let score = 0;

  if (result.title) score += 2;
  if (result.account) score += 1;
  if (result.publishTime) score += 1;
  if (text.length >= 500) score += 2;
  if (text.length >= 1500) score += 1;
  if (isTextUseful(text)) score += 2;

  return {
    score,
    useful: score >= 5 && isTextUseful(text),
    textLength: text.length
  };
}

export function buildDiagnostic(result) {
  const text = normalizeText(result.text);
  const scored = scoreExtraction({ ...result, text });
  const lowerText = text.toLowerCase();

  if (
    text.includes('需要登录') ||
    text.includes('请在微信客户端打开') ||
    lowerText.includes('login')
  ) {
    return {
      status: 'failed',
      reason: '页面疑似要求登录或在微信客户端打开',
      score: scored.score,
      textLength: scored.textLength
    };
  }

  if (!text) {
    return {
      status: 'failed',
      reason: '未提取到正文',
      score: scored.score,
      textLength: 0
    };
  }

  if (!scored.useful) {
    return {
      status: 'partial',
      reason: '只提取到少量文本，可能不是完整正文',
      score: scored.score,
      textLength: scored.textLength
    };
  }

  return {
    status: 'ok',
    reason: `${result.method ?? 'unknown'} 提取到可用正文`,
    score: scored.score,
    textLength: scored.textLength
  };
}
