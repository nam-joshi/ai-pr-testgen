import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import OpenAI from "openai";

const MODEL = "gpt-4o-mini";

const DATA_FILE = path.join(process.cwd(), "data", "pr-files.json");
const OUT_FILE = path.join(process.cwd(), "data", "pr-ai-suggestions.json");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function buildPrompt(pr) {
  return `
Analyze the following Cypress test code changes and generate:
- 3 smoke tests
- 3 negative tests
- 3 edge-case tests

Return JSON array only.

PR Title: ${pr.title}

Changed Files:
${pr.files.map((f) => `File: ${f.filename}\nPatch:\n${f.patch}`).join("\n")}
`;
}

async function analyze() {
  if (!fs.existsSync(DATA_FILE)) {
    console.error("❌ Run get-pr-files.mjs first.");
    return;
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE));

  const output = [];

  for (const pr of data) {
    if (!pr.files || pr.files.length === 0) {
      console.log(`Skipping PR #${pr.pr_number} (no Cypress changes)`);
      continue;
    }

    console.log(`Analyzing PR #${pr.pr_number}: ${pr.title}`);

    try {
      const prompt = buildPrompt(pr);

      const result = await openai.chat.completions.create({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      });

      let raw = result.choices[0].message.content.trim();
      let suggestions;

      try {
        suggestions = JSON.parse(raw);
      } catch {
        suggestions = raw
          .split("\n")
          .filter((l) => l.trim())
          .map((l) => l.replace(/^-/, "").trim());
      }

      output.push({
        pr_number: pr.pr_number,
        title: pr.title,
        suggestions,
        source: "openai",
      });

      console.log("AI Suggestions:");
      suggestions.forEach((s) => console.log("- " + s));
    } catch (err) {
      console.log("❌ OpenAI failed, fallback suggestions used.");
      output.push({
        pr_number: pr.pr_number,
        title: pr.title,
        suggestions: [
          "Test that the homepage loads",
          "Verify navigation menu renders",
          "Check that important links are visible",
        ],
        source: "fallback",
      });
    }

    console.log("----------------------");
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));
  console.log("✔ Saved to data/pr-ai-suggestions.json");
}

analyze();
