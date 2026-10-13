export class CompatibilityResponseDto {
  id: string;

  resumeVersionId: string;

  targetRole: string | null;

  jobDescription: string | null;

  status: string;

  failureReason: string | null;

  scores: {
    overall: number | null;
    technical: number | null;
    experience: number | null;
    projects: number | null;
    tools: number | null;
    roleAlignment: number | null;
    education: number | null;
  };

  readinessLevel: string | null;

  skills: {
    skillName: string;
    matchType: string;
  }[];

  strengths: string[];

  weaknesses: string[];

  recommendations: string[];

  meta: {
    aiProvider: string | null;
    aiModel: string | null;
    promptVersion: string | null;
    scoringConfigVersion: string | null;
  };

  createdAt: Date;
}
