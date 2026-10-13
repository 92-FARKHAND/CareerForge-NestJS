// parsers/document/document-parser.interface.ts

export interface DocumentParser {
  supports(mimeType: string): boolean;

  extractText(buffer: Buffer): Promise<string>;
}
