import { createWorker } from 'tesseract.js';

import { normalizeText } from './text.js';

export async function runOcr(imagePath, options = {}) {
  const worker = await createWorker(options.language ?? 'chi_sim+eng');

  try {
    const result = await worker.recognize(imagePath);
    return normalizeText(result.data.text);
  } finally {
    await worker.terminate();
  }
}
