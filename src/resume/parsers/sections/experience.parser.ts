import { Injectable } from "@nestjs/common";
import { ExperienceParser } from "src/resume/types/parser-inetrfaces";
import {
  ExperienceItem,
  ExtractedSection,
} from "src/resume/types/resume-sections";

import {
  findDateRange,
  looksLikeHeading,
  looksLikeLocation,
  stripBullet,
  stripMatch,
} from "../../utils/resume-text.utils";

@Injectable()
export class DefaultExperienceParser implements ExperienceParser {
  parse(section: ExtractedSection): ExperienceItem[] {
    const lines = this.normalizeLines(section.content);

    const items: ExperienceItem[] = [];
    let current: ExperienceItem | null = null;
    let inBody = false;

    for (const line of lines) {
      const hasBullet = line !== stripBullet(line);

      // ------------------------------------------------------------
      // 1. Compact header:
      // "Software Engineer · Cloudlane · 2023-Present"
      // ------------------------------------------------------------
      const compact = this.parseCompactHeader(line);

      if (compact) {
        if (current && this.hasContent(current)) {
          items.push(current);
        }

        current = compact;
        inBody = false;
        continue;
      }

      // ------------------------------------------------------------
      // 2. Bullet = always description
      // ------------------------------------------------------------
      if (hasBullet) {
        current ??= this.createExperience(null);

        this.appendDescription(current, line);
        inBody = true;
        continue;
      }

      // ------------------------------------------------------------
      // 3. If no current entry, this is probably the title
      // ------------------------------------------------------------
      if (!current) {
        current = this.createExperience(line);
        continue;
      }

      // ------------------------------------------------------------
      // 4. Date range
      // ------------------------------------------------------------
      const dateRange = findDateRange(line);

      if (dateRange) {
        this.applyDateRange(current, line, dateRange);
        continue;
      }

      // ------------------------------------------------------------
      // 5. Company
      // ------------------------------------------------------------
      if (!current.company && !inBody) {
        current.company = line;
        continue;
      }

      // ------------------------------------------------------------
      // 6. Location
      // ------------------------------------------------------------
      if (
        !current.location &&
        !inBody &&
        looksLikeLocation(line)
      ) {
        current.location = line;
        continue;
      }

      // ------------------------------------------------------------
      // 7. New experience heading
      //
      // Only consider a heading to be a new entry AFTER we've
      // already consumed the current entry's body.
      // ------------------------------------------------------------
      if (
        inBody &&
        this.looksLikeNewEntry(line, current)
      ) {
        items.push(current);

        current = this.createExperience(line);
        inBody = false;
        continue;
      }

      // ------------------------------------------------------------
      // 8. Remaining non-header text = description
      // ------------------------------------------------------------
      this.appendDescription(current, line);
      inBody = true;
    }

    if (current && this.hasContent(current)) {
      items.push(current);
    }

    return items;
  }

  // ------------------------------------------------------------------
  // Normalization
  // ------------------------------------------------------------------

  private normalizeLines(content: string): string[] {
    return content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  // ------------------------------------------------------------------
  // Compact header parsing
  // ------------------------------------------------------------------

  /**
   * Handles:
   *
   * Software Engineer · Cloudlane · 2023-Present
   * Software Engineer | Cloudlane | Portland, OR | 2023-Present
   * Software Engineer - Cloudlane - 2023-Present
   */
  private parseCompactHeader(
    line: string,
  ): ExperienceItem | null {
    const dateRange = findDateRange(line);

    if (!dateRange) {
      return null;
    }

    const beforeDate = stripMatch(
      line,
      dateRange.raw,
    );

    const parts = beforeDate
      .split(/\s*[·|]\s*|\s+-\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

    // A date by itself isn't enough to identify a compact header.
    if (parts.length < 2) {
      return null;
    }

    const item = this.createExperience(parts[0]);

    item.startDate = dateRange.startDate;
    item.endDate = dateRange.endDate;

    // First part = title
    // Second part = company
    // Remaining parts = usually location
    item.company = parts[1] ?? null;

    if (parts.length > 2) {
      item.location = parts.slice(2).join(", ");
    }

    return item;
  }

  // ------------------------------------------------------------------
  // Date handling
  // ------------------------------------------------------------------

  private applyDateRange(
    item: ExperienceItem,
    line: string,
    dateRange: {
      startDate: string;
      endDate: string;
      raw: string;
    },
  ): void {
    item.startDate ??= dateRange.startDate;
    item.endDate ??= dateRange.endDate;

    const remainder = stripMatch(
      line,
      dateRange.raw,
    );

    if (!remainder) {
      return;
    }

    this.assignCompanyOrLocation(
      item,
      remainder,
    );
  }

  // ------------------------------------------------------------------
  // Entry boundary detection
  // ------------------------------------------------------------------

  private looksLikeNewEntry(
    line: string,
    current: ExperienceItem,
  ): boolean {
    // A new entry normally looks like a title.
    if (!looksLikeHeading(line)) {
      return false;
    }

    // Don't treat arbitrary headings as jobs unless the
    // current entry already has enough header information.
    if (!current.company) {
      return false;
    }

    // Strong signal: heading contains a date.
    if (findDateRange(line)) {
      return true;
    }

    // If current entry already has a body, a heading-like line
    // is a reasonable new-entry boundary.
    return Boolean(current.title && current.company);
  }

  // ------------------------------------------------------------------
  // Company / location
  // ------------------------------------------------------------------

  private assignCompanyOrLocation(
    item: ExperienceItem,
    remainder: string,
  ): void {
    if (!remainder) {
      return;
    }

    const parts = remainder
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (!parts.length) {
      return;
    }

    if (!item.company) {
      item.company = parts[0];

      if (parts.length > 1) {
        item.location = parts
          .slice(1)
          .join(", ");
      }

      return;
    }

    if (!item.location) {
      item.location = remainder;
    }
  }

  // ------------------------------------------------------------------
  // Description
  // ------------------------------------------------------------------

  private appendDescription(
    item: ExperienceItem,
    line: string,
  ): void {
    item.description = item.description
      ? `${item.description} ${line}`
      : line;
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  private hasContent(
    item: ExperienceItem,
  ): boolean {
    return Boolean(
      item.title ||
        item.company ||
        item.location ||
        item.startDate ||
        item.endDate ||
        item.description,
    );
  }

  private createExperience(
    title: string | null,
  ): ExperienceItem {
    return {
      title,
      company: null,
      location: null,
      startDate: null,
      endDate: null,
      description: null,
    };
  }
}
