import { config } from "dotenv";
config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { indexPortfolio } from "../lib/vectorstore";

const PORTFOLIO_PATH = path.join(process.cwd(), "src/data/portfolio.json");

async function reindex(reason: string) {
  console.log(`[portfolio] ${reason} — indexing...`);
  try {
    const count = await indexPortfolio();
    console.log(`[portfolio] Done. ${count} projects indexed ✓\n`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[portfolio] Failed: ${msg}\n`);
  }
}

async function main() {
  await reindex("Starting up");

  let debounce: ReturnType<typeof setTimeout> | null = null;

  fs.watch(PORTFOLIO_PATH, { persistent: true }, () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => reindex("Change detected in portfolio.json"), 500);
  });

  console.log(`[portfolio] Watching src/data/portfolio.json for changes...`);
  console.log(`[portfolio] Press Ctrl+C to stop\n`);
}

main();
