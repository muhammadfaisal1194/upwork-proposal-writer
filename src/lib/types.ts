export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  industry: string;
  outcome: string;
  highlights?: string[];
}

export interface Portfolio {
  freelancer: {
    name: string;
    tagline: string;
    years_experience: number;
  };
  projects: Project[];
}

export type Tone = "friendly" | "confident" | "technical";
export type Length = "short" | "medium" | "long";

export interface GenerateRequest {
  jobDescription: string;
  tone: Tone;
  length: Length;
}

export interface GenerateResponse {
  proposal: string;
  matchedProjects: Pick<Project, "id" | "title">[];
  error?: string;
}

export interface WorkflowState {
  jobDescription: string;
  tone: Tone;
  length: Length;
  jobAnalysis: string;
  relevantProjects: Project[];
  proposal: string;
}
