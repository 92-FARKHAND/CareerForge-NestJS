import { Injectable } from "@nestjs/common";
import mammoth from "mammoth";

import { DocumentParser } from "./document-parser.interface";
import { TextNormalizer } from "../text/text-normalizer";

@Injectable()
export class DocxParser implements DocumentParser {
  constructor(
    private readonly textNormalizer: TextNormalizer,
  ) {}

  supports(mimeType: string): boolean {
    return (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
  }

  async extractText(buffer: Buffer): Promise<string> {
    if (!buffer?.length) {
      throw new Error("DOCX buffer is empty");
    }

    try {
      const result = await mammoth.extractRawText({
        buffer,
      });

      return this.textNormalizer.normalize(result.value).text;
    } catch (error) {
      throw new Error(
        `Failed to extract DOCX text: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
