import { NextRequest, NextResponse } from "next/server";
import { runProposalWorkflow } from "@/lib/workflow";
import type { GenerateRequest, GenerateResponse } from "@/lib/types";

export async function POST(req: NextRequest): Promise<NextResponse<GenerateResponse>> {
  try {
    const body = (await req.json()) as GenerateRequest;
    const { jobDescription, tone = "confident", length = "medium" } = body;

    if (!jobDescription?.trim()) {
      return NextResponse.json(
        { proposal: "", matchedProjects: [], error: "Job description is required." },
        { status: 400 }
      );
    }

    if (jobDescription.trim().length < 50) {
      return NextResponse.json(
        { proposal: "", matchedProjects: [], error: "Job description is too short. Paste the full job posting." },
        { status: 400 }
      );
    }

    const { proposal, relevantProjects } = await runProposalWorkflow(
      jobDescription.trim(),
      tone,
      length
    );

    return NextResponse.json({
      proposal,
      matchedProjects: relevantProjects.map((p) => ({ id: p.id, title: p.title })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[generate] error:", message);
    return NextResponse.json(
      { proposal: "", matchedProjects: [], error: `Generation failed: ${message}` },
      { status: 500 }
    );
  }
}
