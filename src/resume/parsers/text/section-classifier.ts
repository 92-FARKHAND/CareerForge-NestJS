import { Injectable } from "@nestjs/common";
import {
  ResumeSectionType,
  SECTION_ALIASES,
} from "src/resume/types/resume-sections";
import {
  collapseLetterSpacing,
  isLetterSpaced,
} from "../../utils/resume-text.utils"; // NOTE: adjust this relative path to wherever you place resume-text.util.ts
 
const FUZZY_MATCH_THRESHOLD = 0.65;
 
// Generic connector words excluded from the fuzzy word-overlap score so a
// single common word shared with a multi-word alias can't trigger a match
// on its own (see upgrade note #2 above).
const FUZZY_STOPWORDS = new Set([
  "and",
  "of",
  "the",
  "in",
  "on",
  "for",
  "to",
  "with",
  "from",
  "by",

  // Very generic resume words
  "work",
  "experience",
  "history",
  "background",
  "professional",
  "personal",
  "general",
  "key",
  "relevant",
  "selected",
  "major",
  "core",
  "other",

  // Generic section terminology
  "skills",
  "areas",
  "field",
  "fields",
  "information",
  "details",
]);

 
@Injectable()
export class SectionClassifier {
  private readonly aliasMap = this.buildAliasMap();
 
  classify(heading: string): ResumeSectionType | null {
    const normalized = this.normalize(heading);
 
    if (!normalized) {
      return null;
    }
 
    const exact = this.aliasMap.get(normalized);
 
    if (exact) {
      return exact;
    }
 
    return this.classifyFuzzy(normalized);
  }
 
  /**
   * True only for the narrow, high-confidence "unknown heading" signal
   * described in upgrade note #3: the line was letter-spaced in the
   * original text. Used by SectionDetector to still open a new section
   * for a heading wording we don't recognize at all.
   */
  looksLikeUnknownHeading(originalLine: string): boolean {
    return isLetterSpaced(originalLine.trim());
  }
 
  private classifyFuzzy(normalized: string): ResumeSectionType | null {
    const headingWords = normalized
      .split(" ")
      .filter(Boolean)
      .filter((word) => !FUZZY_STOPWORDS.has(word));
    const headingWordSet = new Set(headingWords);
 
    let bestType: ResumeSectionType | null = null;
    let bestScore = 0;
 
    for (const [alias, type] of this.aliasMap.entries()) {
      let score: number;
 
      if (normalized.includes(alias) || alias.includes(normalized)) {
        // Strong signal: the full alias phrase (or the full heading) is
        // contained in the other. Not stopword-filtered on purpose - this
        // path already requires a much longer, more specific match.
        score =
          Math.min(alias.length, normalized.length) /
          Math.max(alias.length, normalized.length);
      } else {
        const aliasWords = alias
          .split(" ")
          .filter(Boolean)
          .filter((word) => !FUZZY_STOPWORDS.has(word));
 
        if (!aliasWords.length || !headingWordSet.size) {
          score = 0;
        } else {
          const shared = aliasWords.filter((word) =>
            headingWordSet.has(word),
          ).length;
          score = shared / Math.max(aliasWords.length, headingWords.length);
        }
      }
 
      if (score > bestScore) {
        bestScore = score;
        bestType = type;
      }
    }
 
    return bestScore >= FUZZY_MATCH_THRESHOLD ? bestType : null;
  }
 
  private normalize(value: string): string {
    const normalized = value
      .toLowerCase()
      .replace(/[|:]/g, "")
      .replace(/\s+/g, " ")
      .trim();
 
    return collapseLetterSpacing(normalized);
  }
 
  private buildAliasMap(): Map<string, ResumeSectionType> {
    const map = new Map<string, ResumeSectionType>();
 
    for (const [type, aliases] of Object.entries(SECTION_ALIASES)) {
      for (const alias of aliases) {
        map.set(this.normalize(alias), type as ResumeSectionType);
      }
    }
 
    return map;
  }
}