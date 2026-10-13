import { z } from 'zod';

export const SkillMatchTypeSchema = z.enum([
  'MATCHED',
  'PARTIAL',
  'MISSING',
]);

export const RoleAlignmentSchema = z.enum([
  'STRONG',
  'MODERATE',
  'WEAK',
]);

export const CompatibilityAIResultSchema = z.object({
  skillAnalysis: z.array(
    z.object({
      skillName: z.string().min(1),
      matchType: SkillMatchTypeSchema,
      evidence: z.string(),
    }),
  ),

  experienceAnalysis: z.object({
    candidateYears: z.number().nonnegative(),
    relevantYears: z.number().nonnegative(),
    evidence: z.array(z.string()),
  }),

  projectAnalysis: z.object({
    projectCount: z.number().int().nonnegative(),
    relevantProjects: z.array(z.string()),
    evidence: z.array(z.string()),
  }),

  toolsAnalysis: z.object({
    identifiedTools: z.array(z.string()),
    requiredTools: z.array(z.string()),
    matchedTools: z.array(z.string()),
    missingTools: z.array(z.string()),
    evidence: z.array(z.string()),
  }),

  roleAlignmentAnalysis: z.object({
    currentRole: z.string(),
    targetRole: z.string(),
    alignment: RoleAlignmentSchema,
    evidence: z.array(z.string()),
  }),

  educationAnalysis: z.object({
    matched: z.boolean(),
    evidence: z.array(z.string()),
  }),

  strengths: z.array(z.string()),

  weaknesses: z.array(z.string()),

  recommendations: z.array(z.string()),
});

export type CompatibilityAIResult = z.infer<
  typeof CompatibilityAIResultSchema
>;
