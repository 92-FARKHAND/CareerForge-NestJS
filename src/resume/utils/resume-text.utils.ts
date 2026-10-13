// src/resume/utils/resume-text.util.ts
//
// UPGRADED (NEW FILE)
// --------------------------------------------------------------------------
// Centralized, reusable text-processing helpers used by every section/field
// parser. Before this file existed, the URL regex, the "date range" regex,
// and the "strip bullet" logic were each copy-pasted (slightly differently!)
// into 4-5 different parser files. That inconsistency was itself a source of
// bugs (e.g. `project.parser.ts` and `certification.parser.ts` matched URLs
// slightly differently; `certification.parser.ts`'s separator regex
// `[---]` was a character class of three identical "-" characters, which is
// exactly equivalent to a single "-", so it silently never matched an
// en-dash/em-dash separator).
//
// Putting them here means every parser now shares ONE definition, and a fix
// (e.g. supporting "20XX" template placeholder years) only has to happen in
// one place instead of five.

// ---------------------------------------------------------------------------
// Contact detail matchers
// ---------------------------------------------------------------------------

/** Matches emails. */
export const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

/**
 * Matches most phone number formats seen on resumes:
 * "+92 331 1112288", "(770) 625-9669", "770-625-9669", "770.625.9669".
 */
export const PHONE_REGEX =
  /(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?){2,4}\d{3,4}/;

/** Matches http(s) and bare "www." URLs (stops at whitespace/comma/semicolon). */
export const URL_REGEX = /(https?:\/\/[^\s,;]+|www\.[^\s,;]+)/i;
export const URL_REGEX_GLOBAL = new RegExp(URL_REGEX.source, "gi");

/** True if `text` contains at least one email address. */
export function extractEmail(text: string): string | null {
  const match = text.match(EMAIL_REGEX);
  return match ? match[0] : null;
}

/**
 * True if `text` contains something that looks like a phone number.
 * Requires >= 7 digits total so we don't false-positive on a bare year
 * ("2024") or a percentage ("150+").
 */
export function extractPhone(text: string): string | null {
  const match = text.match(PHONE_REGEX);
  if (!match) return null;
  const digits = match[0].replace(/\D/g, "");
  return digits.length >= 7 ? match[0].trim() : null;
}

/** Removes trailing punctuation a sentence often leaves stuck to a URL. */
export function cleanUrl(url: string): string {
  return url.replace(/[),.;]+$/, "");
}

export function extractUrls(text: string): string[] {
  return (text.match(URL_REGEX_GLOBAL) ?? []).map(cleanUrl);
}

// ---------------------------------------------------------------------------
// Bullet / list markers
// ---------------------------------------------------------------------------

/** Bullet / list marker glyphs seen across resume templates and PDFs. */
export const BULLET_REGEX = /^[\s]*[•●▪◦‣∙·◆➤➢\-*–—]\s*/;

/** Strips a single leading bullet marker, if present. */
export function stripBullet(line: string): string {
  return line.replace(BULLET_REGEX, "").trim();
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const MONTHS =
  "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";

/** Matches a real 4-digit year OR a template placeholder like "20XX". */
const YEAR = "(?:\\d{4}|\\d{2}[Xx]{2})";

/** A single date "point": "Jan 2021", "01/2021", or a bare "2021"/"20XX". */
const DATE_POINT = `(?:(?:${MONTHS})\\.?\\s+${YEAR}|\\d{1,2}[/.]${YEAR}|${YEAR})`;

/** Words that close out an ongoing date range. */
const OPEN_ENDED = "present|current|now|ongoing|to\\s*date";

const DATE_RANGE_REGEX = new RegExp(
  `(${DATE_POINT})\\s*(?:-|–|—|\\bto\\b|\\bthrough\\b)\\s*(${DATE_POINT}|${OPEN_ENDED})`,
  "i",
);

const TRAILING_DATE_REGEX = new RegExp(`,?\\s*(${DATE_POINT})\\s*$`, "i");

export interface DateRange {
  startDate: string;
  endDate: string;
  /** The exact substring that was matched, so callers can strip it out. */
  raw: string;
}

/**
 * Finds a start/end date pair ANYWHERE in a line, not only when the date
 * range is the entire line. Real resumes format date lines many ways:
 *   "Jan 2021 - Present"
 *   "Sep 20XX – Present"
 *   "2022 - 2026"
 *   "Franklin & Rodgers Business Solutions, Scottsdale, AZ, Sep 20XX - Present"
 * The last example is extremely common in ATS-style single-line entries and
 * was completely missed by a strict "^date - date$" match.
 */
export function findDateRange(line: string): DateRange | null {
  const match = line.match(DATE_RANGE_REGEX);

  if (!match) {
    return null;
  }

  return {
    startDate: match[1].trim(),
    endDate: match[2].trim(),
    raw: match[0],
  };
}

export function extractSingleYear(
  line: string,
): string | null {
  const match = line.match(/\b(19|20)\d{2}\b/);

  return match ? match[0] : null;
}

/**
 * Finds a single trailing date (not a range) at the end of a line, e.g. a
 * graduation year tacked onto an institution line:
 *   "Wilhem University, Phoenix, AZ, 20XX" -> { date: "20XX", remainder: "Wilhem University, Phoenix, AZ" }
 */
export function extractTrailingDate(
  line: string,
): { date: string; remainder: string } | null {
  const match = line.match(TRAILING_DATE_REGEX);

  if (!match || match.index === undefined) {
    return null;
  }

  return {
    date: match[1].trim(),
    remainder: line
      .slice(0, match.index)
      .replace(/[\s,|·-]+$/, "")
      .trim(),
  };
}

/** Removes a previously-matched substring (e.g. a date range) from a line. */
export function stripMatch(line: string, raw: string): string {
  return line
    .replace(raw, "")
    .replace(/^[\s,|-]+|[\s,|-]+$/g, "")
    .trim();
}

/** US-style "City, ST" or common remote/hybrid labels. */
const US_STATE_SUFFIX = /,\s*[A-Z]{2}\b/;

export function looksLikeLocation(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || findDateRange(trimmed)) return false;
  return US_STATE_SUFFIX.test(trimmed) || /remote|hybrid|on-?site/i.test(trimmed);
}

// ---------------------------------------------------------------------------
// Degree detection (education parser)
// ---------------------------------------------------------------------------

const DEGREE_KEYWORDS =
  "bachelor|master|phd|doctorate|associate|diploma|certificate|certified|mba|bfa|bba|bsc?|msc?|ba|ma|as|aa";

// Anchored to the START of the (period-stripped) line: degree designations
// almost always lead the line ("B.S. Accounting", "Bachelor of Arts"), and
// anchoring avoids false positives from short degree-ish tokens ("as") that
// could otherwise match mid-sentence.
const DEGREE_LINE_REGEX = new RegExp(`^(?:${DEGREE_KEYWORDS})\\b`, "i");

export function isDegreeLine(line: string): boolean {
  return DEGREE_LINE_REGEX.test(line.replace(/\./g, "").trim());
}

// ---------------------------------------------------------------------------
// Letter-spacing / whitespace normalization
// ---------------------------------------------------------------------------

/**
 * Detects headings extracted as "L E T T E R   S P A C E D" text (common in
 * PDFs that use expanded letter-tracking for section titles), e.g.
 * "E D U C A T I O N" -> collapses to "EDUCATION".
 */
export function isLetterSpaced(value: string): boolean {
  const words = value.trim().split(/\s+/);
  if (words.length < 3) return false;
  return words.every((word) => /^[a-zA-Z]$/.test(word));
}

export function collapseLetterSpacing(value: string): string {
  return isLetterSpaced(value) ? value.replace(/\s+/g, "") : value;
}

// A single letter is only safe to merge into the following word if it is
// not itself a real one-letter English word ("a", "I"), so we don't corrupt
// legitimate short phrases like "a project" -> "aproject".
const SAFE_TO_MERGE_SINGLE_LETTER = /[B-HJ-Zb-hj-z]/;

/**
 * Fixes a narrower PDF-extraction artifact than full-heading letter-spacing:
 * a stray space injected INSIDE a single word, e.g. "Team W ork" or
 * "W oodCraft System" (both seen verbatim in the reported extraction bugs).
 */
export function fixMidWordSpacing(text: string): string {
  return text.replace(
    /\b([A-Za-z])\s(?=[a-z]{2,}\b)/g,
    (full, letter: string) =>
      SAFE_TO_MERGE_SINGLE_LETTER.test(letter) ? letter : full,
  );
}

/**
 * Full raw-text normalization pass, run ONCE on the whole resume text before
 * it is split into lines/sections. Line breaks are preserved (section
 * detection depends on them); whitespace and mid-word spacing artifacts are
 * fixed so every downstream parser benefits automatically.
 */
export function normalizeResumeText(rawText: string): string {
  return rawText
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => fixMidWordSpacing(line.replace(/\s+/g, " ").trim()))
    .join("\n");
}

// ---------------------------------------------------------------------------
// Heading heuristics
// ---------------------------------------------------------------------------

/**
 * Generic "does this line look like a short title/heading" check. Used by
 * the experience parser to spot the start of a new role even when no bullet
 * markers survived extraction. NOT used to detect unknown SECTION headings
 * (job titles and degree names have the exact same shape as a section
 * heading in plain text - see section-classifier.ts for why that signal is
 * intentionally handled differently and much more conservatively there).
 */
export function looksLikeHeading(line: string): boolean {
  const trimmed = line.trim();

  if (!trimmed || trimmed.length > 40) return false;
  if (/[.!?]$/.test(trimmed)) return false; // sentences aren't headings
  if (EMAIL_REGEX.test(trimmed) || URL_REGEX.test(trimmed)) return false;
  if (extractPhone(trimmed)) return false;
  if (findDateRange(trimmed)) return false;

  const words = trimmed.split(/\s+/);
  if (words.length > 5) return false;

  const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
  const isTitleCase = words.every(
    (word) => /^[A-Z]/.test(word) || word.length <= 3, // allow "of", "and", "MERN", etc.
  );

  return isAllCaps || isTitleCase;
}