import { normalizeText } from './text.js';

function fallback(value, empty = '未识别') {
  const text = normalizeText(value);
  return text || empty;
}

export function toMarkdown(result) {
  const title = fallback(result.title, '公众号文章解析结果');
  const body = normalizeText(result.text) || '未提取到正文。';
  const diagnostic = result.diagnostic ?? {
    status: 'unknown',
    reason: '未生成诊断信息',
    score: 0
  };
  const artifacts = result.artifacts?.length
    ? result.artifacts.map((item) => `- ${item}`).join('\n')
    : '- 无';

  return `# ${title}

## 元数据

- 公众号：${fallback(result.account)}
- 发布时间：${fallback(result.publishTime)}
- 原文链接：${fallback(result.url)}
- 获取方式：${fallback(result.method, 'unknown')}
- 诊断：${diagnostic.status} - ${diagnostic.reason}
- 评分：${diagnostic.score}

## 产物

${artifacts}

## 正文

${body}
`;
}
