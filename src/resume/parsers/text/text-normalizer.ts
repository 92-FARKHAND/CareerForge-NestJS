import {NormalizedText} from '../../types/normalized-text'

export class TextNormalizer {
  normalize(input: string): NormalizedText {
    const text = input
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\u00a0/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const lines = text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    return {
      text: lines.join('\n'),
      lines,
    };
  }
}
