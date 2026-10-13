import { Injectable } from "@nestjs/common";
import { PDFParse } from "pdf-parse";

import { DocumentParser } from "./document-parser.interface";
import { TextNormalizer } from "../text/text-normalizer";

@Injectable()
export class PdfParser implements DocumentParser {
  constructor(
    private readonly textNormalizer: TextNormalizer,
  ) {}

  supports(mimeType: string): boolean {
    return mimeType === "application/pdf";
  }

  async extractText(buffer: Buffer): Promise<string> {
    if (!buffer?.length) {
      throw new Error("PDF buffer is empty");
    }

    try {
      const parser = new PDFParse({ data: buffer });

      const result = await parser.getText();

      return this.textNormalizer.normalize(result.text).text;
    } catch (error) {
      throw new Error(
        `Failed to extract PDF text: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
