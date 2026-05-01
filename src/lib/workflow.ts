import { StateGraph, Annotation } from "@langchain/langgraph";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getRelevantProjects } from "./portfolio";
import type { Project, Tone, Length } from "./types";

// ── State ─────────────────────────────────────────────────────────────────────

const ProposalState = Annotation.Root({
  jobDescription: Annotation<string>({
    reducer: (_, b) => b,
  }),
  tone: Annotation<Tone>({
    reducer: (_, b) => b,
  }),
  length: Annotation<Length>({
    reducer: (_, b) => b,
  }),
  jobAnalysis: Annotation<string>({
    reducer: (_, b) => b,
    default: () => "",
  }),
  relevantProjects: Annotation<Project[]>({
    reducer: (_, b) => b,
    default: () => [],
  }),
  proposal: Annotation<string>({
    reducer: (_, b) => b,
    default: () => "",
  }),
});

type State = typeof ProposalState.State;

// ── Models ────────────────────────────────────────────────────────────────────

const haiku = new ChatAnthropic({
  model: "claude-haiku-4-5-20251001",
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxTokens: 512,
});

const sonnet = new ChatAnthropic({
  model: "claude-sonnet-4-6",
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxTokens: 1024,
  invocationKwargs: { top_p: undefined }, // @langchain/anthropic 0.3.x bug: defaults topP to -1, which the API rejects
});

// ── Nodes ─────────────────────────────────────────────────────────────────────

async function analyzeJob(state: State): Promise<Partial<State>> {
  const response = await haiku.invoke([
    new HumanMessage(
      `Analyze this Upwork job posting in 4–6 bullet points. Be specific and direct.

Extract:
• Core deliverable (what exactly needs to be built or done)
• Required skills and tech stack
• Project scale/complexity (small task, medium project, ongoing work)
• The client's underlying goal (what business outcome do they want)
• Any red flags or important constraints

Job posting:
${state.jobDescription}

Return only the bullet list. No intro, no conclusion.`
    ),
  ]);

  return { jobAnalysis: response.content as string };
}

async function retrieveProjects(state: State): Promise<Partial<State>> {
  const projects = await getRelevantProjects(state.jobDescription, 3);
  return { relevantProjects: projects };
}

async function generateProposal(state: State): Promise<Partial<State>> {
  const toneGuide: Record<Tone, string> = {
    friendly:
      "Warm and approachable, like a trusted colleague — conversational but professional. Show genuine interest without being sycophantic.",
    confident:
      "Direct and assured. You've solved this before, you know what works. No hedging, no qualifiers — just clear capability.",
    technical:
      "Precise and detail-oriented. Demonstrate deep domain knowledge. The client will feel they're talking to someone who truly gets the technical complexity.",
  };

  const lengthGuide: Record<Length, string> = {
    short: "2–3 tight paragraphs, max 100 words total. Every sentence earns its place.",
    medium: "3–4 paragraphs, max 150 words. Enough to build credibility without losing attention.",
    long: "4–5 paragraphs, max 200 words. Room to go deeper on approach and relevant experience.",
  };

  const projectsContext = state.relevantProjects
    .map(
      (p) =>
        `PROJECT: ${p.title}
WHAT I DID: ${p.description}
STACK: ${p.technologies.join(", ")}
RESULT: ${p.outcome}${p.highlights ? "\nKEY POINTS: " + p.highlights.join(" | ") : ""}`
    )
    .join("\n\n");

  const response = await sonnet.invoke([
    new SystemMessage(`You are a senior freelancer with a track record of winning Upwork contracts. You write proposals that sound like a real person wrote them in 10 minutes — not a template, not AI.

TONE: ${toneGuide[state.tone]}
LENGTH: ${lengthGuide[state.length]}

HARD RULES — break any of these and the proposal fails:
1. Never open with "I hope", "I came across your job", "I am writing to", "I am interested in", "I would love to", "I am excited about", "As a [job title]", or any variant of these
2. Never use bullet points or numbered lists in the proposal
3. Never say "perfect fit", "passionate about", "deliver high-quality", "attention to detail", "hard-working", or other hollow phrases
4. Never repeat the client's words back to them verbatim
5. Never sound desperate — no "I would really appreciate this opportunity", no discounting
6. Don't introduce yourself by name or title in the opening line
7. Never end with "looking forward to hearing from you" or "please feel free to reach out"

WHAT MAKES A GREAT PROPOSAL:
• Opens with a sharp insight about the client's problem — something that makes them think "this person actually gets it"
• Addresses the core challenge directly, not the surface-level task
• References past work naturally within the narrative (not as a list) — one or two specific examples max
• Explains your approach briefly — enough to build confidence, not a full spec
• Ends with one specific, thoughtful question that shows you're already thinking about their problem`),
    new HumanMessage(
      `Write a proposal for this job.

JOB POSTING:
${state.jobDescription}

JOB ANALYSIS:
${state.jobAnalysis}

MY RELEVANT PAST WORK (use 1–2 naturally, don't list all):
${projectsContext}

Write the proposal now. Output only the proposal text — no subject line, no heading, no preamble.`
    ),
  ]);

  return { proposal: response.content as string };
}

// ── Graph ─────────────────────────────────────────────────────────────────────

const graph = new StateGraph(ProposalState)
  .addNode("analyzeJob", analyzeJob)
  .addNode("retrieveProjects", retrieveProjects)
  .addNode("generateProposal", generateProposal)
  .addEdge("__start__", "analyzeJob")
  .addEdge("__start__", "retrieveProjects")
  .addEdge("analyzeJob", "generateProposal")
  .addEdge("retrieveProjects", "generateProposal")
  .compile();

// ── Public API ────────────────────────────────────────────────────────────────

export async function runProposalWorkflow(
  jobDescription: string,
  tone: Tone,
  length: Length
): Promise<{ proposal: string; relevantProjects: Project[] }> {
  const result = await graph.invoke({
    jobDescription,
    tone,
    length,
  });

  return {
    proposal: result.proposal,
    relevantProjects: result.relevantProjects,
  };
}
