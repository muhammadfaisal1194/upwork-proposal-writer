import { searchPortfolio } from "./vectorstore";
import type { Project } from "./types";

export async function getRelevantProjects(
  jobDescription: string,
  topK = 3
): Promise<Project[]> {
  return searchPortfolio(jobDescription, topK);
}
