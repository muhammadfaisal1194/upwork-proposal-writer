import { config } from "dotenv";
config({ path: ".env.local" });

import { indexPortfolio } from "../lib/vectorstore";

async function main() {
  console.log("Indexing portfolio...");
  try {
    const count = await indexPortfolio();
    console.log(`Done. ${count} projects indexed.`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Failed:", msg);
    process.exit(1);
  }
}

main();
