import { Injectable } from "@nestjs/common";
import {
  ExtractedSection,
  ResumeSectionType,
} from "src/resume/types/resume-sections";
import { SectionClassifier } from "./section-classifier";
import { normalizeResumeText } from "../../utils/resume-text.utils"; // NOTE: adjust this relative path to wherever you place resume-text.util.ts
 
@Injectable()
export class SectionDetector {
  constructor(private readonly classifier: SectionClassifier) {
    if (!classifier) {
      throw new Error("SectionDetector: SectionClassifier was not injected");
    }
  }
 
  detect(text: string): ExtractedSection[] {
    if (!text?.trim()) {
      return [];
    }
 
    // Keep the pre-normalization lines too: the letter-spacing fallback in
    // looksLikeUnknownHeading needs to see the ORIGINAL spacing shape.
    const rawLines = text.replace(/\r\n?/g, "\n").split("\n");
    const lines = normalizeResumeText(text).split("\n");
 
    const sections: ExtractedSection[] = [];
 
    let current: ExtractedSection | null = null;
    let preamble: string[] = [];
    let preambleStartLine = 0;
 
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index].trim();
 
      if (!line) {
        continue;
      }
 
      const type = this.classifier.classify(line);
      const isUnrecognizedHeading =
        type === null &&
        this.classifier.looksLikeUnknownHeading(rawLines[index] ?? line);
 
      if (type !== null || isUnrecognizedHeading) {
        const resolvedType = type ?? ResumeSectionType.OTHER;
 
        if (current !== null) {
          sections.push(this.finalizeSection(current, index - 1));
          current = {
            type: resolvedType,
            heading: line,
            content: "",
            startLine: index,
            endLine: index,
          };
        } else if (resolvedType === ResumeSectionType.HEADER && preamble.length > 0) {
          // First heading found IS the header/contact heading - merge the
          // preamble (name/title) straight into it instead of creating two
          // separate header-ish sections.
          current = {
            type: ResumeSectionType.HEADER,
            heading: line,
            content: `${preamble.join("\n")}\n`,
            startLine: preambleStartLine,
            endLine: index,
          };
          preamble = [];
        } else {
          if (preamble.length > 0) {
            sections.push(
              this.finalizeSection(
                {
                  type: ResumeSectionType.HEADER,
                  heading: "",
                  content: preamble.join("\n"),
                  startLine: preambleStartLine,
                  endLine: index - 1,
                },
                index - 1,
              ),
            );
          }
 
          current = {
            type: resolvedType,
            heading: line,
            content: "",
            startLine: index,
            endLine: index,
          };
        }
 
        continue;
      }
 
      if (current !== null) {
        current.content += `${line}\n`;
      } else {
        if (preamble.length === 0) {
          preambleStartLine = index;
        }
        preamble.push(line);
      }
    }
 
    if (current !== null) {
      sections.push(this.finalizeSection(current, lines.length - 1));
    } else if (preamble.length > 0) {
      // The document had no recognizable heading at all - still return the
      // content as a HEADER section instead of an empty result.
      sections.push(
        this.finalizeSection(
          {
            type: ResumeSectionType.HEADER,
            heading: "",
            content: preamble.join("\n"),
            startLine: preambleStartLine,
            endLine: lines.length - 1,
          },
          lines.length - 1,
        ),
      );
    }
 
    return sections;
  }
 
  private finalizeSection(
    section: ExtractedSection,
    endLine: number,
  ): ExtractedSection {
    return {
      ...section,
      endLine,
      content: section.content.trim(),
    };
  }
}