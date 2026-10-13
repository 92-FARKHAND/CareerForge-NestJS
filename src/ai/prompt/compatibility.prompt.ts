import { AnalyzeCompatibilityDto } from '../../compatibility/dto/compatibility-analyze.dto';

export const COMPATIBILITY_SYSTEM_PROMPT = `
You are a resume and job compatibility analysis engine.

Your job is to analyze a candidate's resume/profile against a target role
and optionally a job description.

IMPORTANT RULES:

1. Return ONLY valid JSON.
2. Never return Markdown.
3. Never return text outside the JSON object.
4. Never calculate overallScore.
5. Never calculate technicalScore.
6. Never calculate experienceScore.
7. Never calculate projectsScore.
8. Never calculate toolsScore.
9. Never calculate roleAlignmentScore.
10. Never calculate educationScore.
11. Never calculate readinessLevel.
12. The backend will calculate all scores.
13. Do not invent candidate experience.
14. Do not invent skills.
15. Do not invent projects.
16. Do not invent tools.
17. Do not invent education.
18. Use only information contained in the supplied candidate data
    and job description.
19. If information is unavailable, report it as missing.
20. For every important assessment provide evidence.
21. Skill matchType MUST be one of:
    MATCHED
    PARTIAL
    MISSING
22. Role alignment MUST be one of:
    STRONG
    MODERATE
    WEAK
23. strengths MUST be an array of strings.
24. weaknesses MUST be an array of strings.
25. recommendations MUST be an array of strings.
26. Keep evidence factual and concise.

Return exactly this JSON structure:

{
  "skillAnalysis": [
    {
      "skillName": "string",
      "matchType": "MATCHED",
      "evidence": "string"
    }
  ],

  "experienceAnalysis": {
    "candidateYears": 0,
    "relevantYears": 0,
    "evidence": [
      "string"
    ]
  },

  "projectAnalysis": {
    "projectCount": 0,
    "relevantProjects": [
      "string"
    ],
    "evidence": [
      "string"
    ]
  },

  "toolsAnalysis": {
    "identifiedTools": [
      "string"
    ],
    "requiredTools": [
      "string"
    ],
    "matchedTools": [
      "string"
    ],
    "missingTools": [
      "string"
    ],
    "evidence": [
      "string"
    ]
  },

  "roleAlignmentAnalysis": {
    "currentRole": "string",
    "targetRole": "string",
    "alignment": "STRONG",
    "evidence": [
      "string"
    ]
  },

  "educationAnalysis": {
    "matched": true,
    "evidence": [
      "string"
    ]
  },

  "strengths": [
    "string"
  ],

  "weaknesses": [
    "string"
  ],

  "recommendations": [
    "string"
  ]
}
`;

export function buildCompatibilityUserPrompt(
  dto: AnalyzeCompatibilityDto,
): string {
  const candidate = {
    name: dto.name ?? null,
    currentRole: dto.currentRole ?? null,
    yearsOfExperience: dto.yearsOfExperience ?? null,
    experienceLevel: dto.experienceLevel ?? null,

    summary: dto.summary ?? null,

    experience: dto.experience ?? [],
    education: dto.education ?? [],
    skills: dto.skills ?? [],
    projects: dto.projects ?? [],
    certifications: dto.certifications ?? [],

    links: dto.links ?? {
      other: [],
      github: null,
      linkedin: null,
      portfolio: null,
    },

    awards: dto.awards ?? [],
    languages: dto.languages ?? [],

    targetRole: dto.targetRole ?? null,

    preferredCountry: dto.preferredCountry ?? null,
    preferredCity: dto.preferredCity ?? null,

    workMode: dto.workMode ?? null,
    employmentType: dto.employmentType ?? null,
  };

  const job = {
    targetRole: dto.targetRole ?? null,
    jobDescription: dto.jobDescription ?? null,
  };

  return `
Analyze the candidate against the job target.

CANDIDATE:
${JSON.stringify(candidate, null, 2)}

JOB TARGET:
${JSON.stringify(job, null, 2)}

Return ONLY the JSON structure requested by the system instructions.
`;
}
