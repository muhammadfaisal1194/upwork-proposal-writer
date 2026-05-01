import { OpenAIEmbeddings } from "@langchain/openai";
import fs from "fs/promises";
import path from "path";
import type { Project, Portfolio } from "./types";

const PORTFOLIO_PATH = path.join(process.cwd(), "src/data/portfolio.json");
const INDEX_PATH = path.join(process.cwd(), "src/data/portfolio_index.json");

interface IndexEntry {
  id: string;
  embedding: number[];
}

interface PortfolioIndex {
  entries: IndexEntry[];
}

function embeddings() {
  return new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY,
  });
}

async function loadPortfolio(): Promise<Portfolio> {
  const raw = await fs.readFile(PORTFOLIO_PATH, "utf-8");
  return JSON.parse(raw) as Portfolio;
}

function projectToText(p: Project): string {
  return [
    p.title,
    p.description,
    `Technologies: ${p.technologies.join(", ")}`,
    `Industry: ${p.industry}`,
    `Outcome: ${p.outcome}`,
    p.highlights?.join(". ") ?? "",
  ]
    .filter(Boolean)
    .join(". ");
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Full re-index: embeds all projects, writes embeddings to portfolio_index.json. */
export async function indexPortfolio(): Promise<number> {
  const portfolio = await loadPortfolio();
  const projects = portfolio.projects;

  const texts = projects.map(projectToText);
  const vectors = await embeddings().embedDocuments(texts);

  const index: PortfolioIndex = {
    entries: projects.map((p, i) => ({ id: p.id, embedding: vectors[i] })),
  };

  await fs.writeFile(INDEX_PATH, JSON.stringify(index), "utf-8");
  return projects.length;
}

/** Loads the local index, computes cosine similarity, returns top K Project objects. */
export async function searchPortfolio(query: string, topK = 3): Promise<Project[]> {
  let index: PortfolioIndex;
  try {
    const raw = await fs.readFile(INDEX_PATH, "utf-8");
    index = JSON.parse(raw) as PortfolioIndex;
  } catch {
    throw new Error('Portfolio not indexed. Run "npm run index" first.');
  }

  const portfolio = await loadPortfolio();
  const queryVector = await embeddings().embedQuery(query);

  const scored = index.entries.map((entry) => ({
    id: entry.id,
    score: cosineSimilarity(queryVector, entry.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);
  const topIds = scored.slice(0, topK).map((s) => s.id);

  return topIds
    .map((id) => portfolio.projects.find((p) => p.id === id))
    .filter((p): p is Project => p !== undefined);
}
