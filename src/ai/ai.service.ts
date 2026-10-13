import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';

import {
  CompatibilityAIResult,
  CompatibilityAIResultSchema,
} from '../compatibility/schema/compatibility.ai.schema';

import {
  COMPATIBILITY_SYSTEM_PROMPT,
  buildCompatibilityUserPrompt,
} from './prompt/compatibility.prompt';

import { AnalyzeCompatibilityDto } from '../compatibility/dto/compatibility-analyze.dto';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  private readonly ai: GoogleGenAI;

  private readonly model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY is not configured',
      );
    }

    this.model =
      process.env.GEMINI_MODEL ??
      'gemini-2.5-flash';

    this.ai = new GoogleGenAI({
      apiKey,
    });
  }

  async analyzeCompatibility(
    dto: AnalyzeCompatibilityDto,
  ): Promise<CompatibilityAIResult> {
    const userPrompt =
      buildCompatibilityUserPrompt(dto);

    try {
      const response =
        await this.ai.models.generateContent({
          model: this.model,

          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `${COMPATIBILITY_SYSTEM_PROMPT}

${userPrompt}`,
                },
              ],
            },
          ],

          config: {
            temperature: 0.1,
            responseMimeType: 'application/json',
          },
        });

      const text = response.text;

      if (!text) {
        throw new Error(
          'Gemini returned an empty response',
        );
      }

      let parsed: unknown;

      try {
        parsed = JSON.parse(text);
      } catch {
        this.logger.error(
          'Gemini returned invalid JSON',
        );

        throw new Error(
          'Gemini returned invalid JSON',
        );
      }

      const result =
        CompatibilityAIResultSchema.safeParse(
          parsed,
        );

      if (!result.success) {
        this.logger.error(
          'Gemini response failed schema validation',
          result.error.flatten(),
        );

        throw new Error(
          'Gemini response does not match the expected structure',
        );
      }

      return result.data;
    } catch (error) {
      this.logger.error(
        'Compatibility analysis failed',
        error instanceof Error
          ? error.stack
          : String(error),
      );

      throw new InternalServerErrorException(
        'Unable to analyze resume compatibility',
      );
    }
  }
}
