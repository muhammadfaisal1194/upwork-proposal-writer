"use client";

import { useState, useRef } from "react";
import type { Tone, Length, GenerateResponse } from "@/lib/types";

type Status = "idle" | "loading" | "done" | "error";

const TONE_OPTIONS: { value: Tone; label: string; desc: string }[] = [
  { value: "confident", label: "Confident", desc: "Direct & assured" },
  { value: "friendly", label: "Friendly", desc: "Warm & conversational" },
  { value: "technical", label: "Technical", desc: "Precise & detailed" },
];

const LENGTH_OPTIONS: { value: Length; label: string; desc: string }[] = [
  { value: "short", label: "Short", desc: "~150–200 words" },
  { value: "medium", label: "Medium", desc: "~250–350 words" },
  { value: "long", label: "Long", desc: "~400–500 words" },
];

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState<Tone>("confident");
  const [length, setLength] = useState<Length>("medium");
  const [status, setStatus] = useState<Status>("idle");
  const [proposal, setProposal] = useState("");
  const [matchedProjects, setMatchedProjects] = useState<{ id: string; title: string }[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const proposalRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = proposal.trim() ? proposal.trim().split(/\s+/).length : 0;

  async function generate() {
    if (!jobDescription.trim()) return;
    setStatus("loading");
    setError("");
    setProposal("");
    setMatchedProjects([]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, tone, length }),
      });

      const data: GenerateResponse = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong.");
        setStatus("error");
        return;
      }

      setProposal(data.proposal);
      setMatchedProjects(data.matchedProjects);
      setStatus("done");
      setTimeout(() => proposalRef.current?.focus(), 100);
    } catch {
      setError("Network error. Make sure the server is running.");
      setStatus("error");
    }
  }

  async function copyProposal() {
    if (!proposal) return;
    await navigator.clipboard.writeText(proposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function clear() {
    setJobDescription("");
    setProposal("");
    setMatchedProjects([]);
    setStatus("idle");
    setError("");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-white">Proposal Generator</h1>
            <p className="text-xs text-gray-500 mt-0.5">Upwork · AI-powered · Local</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Ready
            </span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">

          {/* ── Left: Input ── */}
          <div className="flex flex-col gap-4">

            {/* Job Description */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full Upwork job posting here…"
                rows={16}
                className="w-full rounded-xl bg-gray-900 border border-gray-700 text-gray-100 text-sm p-4 resize-none placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              <p className="text-xs text-gray-600 text-right">
                {jobDescription.trim() ? jobDescription.trim().split(/\s+/).length : 0} words
              </p>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-4">
              {/* Tone */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Tone</label>
                <div className="flex flex-col gap-1.5">
                  {TONE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTone(opt.value)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm border transition-all ${
                        tone === opt.value
                          ? "bg-blue-600/20 border-blue-500 text-blue-300"
                          : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                      }`}
                    >
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs opacity-70">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Length */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Length</label>
                <div className="flex flex-col gap-1.5">
                  {LENGTH_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setLength(opt.value)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm border transition-all ${
                        length === opt.value
                          ? "bg-blue-600/20 border-blue-500 text-blue-300"
                          : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                      }`}
                    >
                      <span className="font-medium">{opt.label}</span>
                      <span className="text-xs opacity-70">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generate}
              disabled={status === "loading" || !jobDescription.trim()}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.99]"
            >
              {status === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner />
                  Generating…
                </span>
              ) : (
                "Generate Proposal"
              )}
            </button>

          </div>

          {/* ── Right: Output ── */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">Your Proposal</label>
              <div className="flex items-center gap-2">
                {status === "done" && wordCount > 0 && (
                  <span className="text-xs text-gray-500">{wordCount} words</span>
                )}
                {proposal && (
                  <button
                    onClick={clear}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={copyProposal}
                  disabled={!proposal}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    copied
                      ? "bg-emerald-600/20 border-emerald-500 text-emerald-300"
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white"
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckIcon />
                      Copied
                    </>
                  ) : (
                    <>
                      <CopyIcon />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Proposal textarea */}
            <textarea
              ref={proposalRef}
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              placeholder={
                status === "loading"
                  ? "Analyzing job and finding best-match projects…"
                  : "Your proposal will appear here. Edit before submitting."
              }
              rows={16}
              className={`w-full rounded-xl bg-gray-900 border text-sm p-4 resize-none placeholder-gray-600 focus:outline-none focus:ring-1 transition-colors leading-relaxed ${
                status === "loading"
                  ? "border-blue-500/50 text-gray-500 animate-pulse"
                  : status === "error"
                  ? "border-red-500/50 text-gray-100"
                  : "border-gray-700 text-gray-100 focus:border-blue-500 focus:ring-blue-500"
              }`}
            />

            {/* Error message */}
            {status === "error" && error && (
              <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <ErrorIcon />
                <span>{error}</span>
              </div>
            )}

            {/* Matched projects badge */}
            {status === "done" && matchedProjects.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                  Projects used for context
                </p>
                <div className="flex flex-wrap gap-2">
                  {matchedProjects.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-800 border border-gray-700 text-xs text-gray-400"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      {p.title}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tips when idle */}
            {status === "idle" && (
              <div className="rounded-xl bg-gray-900 border border-gray-800 p-4">
                <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">Tips for best results</p>
                <ul className="text-xs text-gray-500 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">·</span>
                    Paste the full job description, not just the title
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">·</span>
                    Edit the output before submitting — make it yours
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">·</span>
                    Update <code className="text-gray-400">src/data/portfolio.json</code> with your real projects
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">·</span>
                    The AI uses only your 2–3 most relevant projects — not all of them
                  </li>
                </ul>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
