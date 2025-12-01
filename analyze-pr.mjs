// analyze-pr.mjs (ESM)
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const DATA_DIR = path.join(process.cwd(), "data");
const PR_FILE = path.join(DATA_DIR, "pr-files.json");
const OUT_FILE = path.join(DATA_DIR, "pr-ai-suggestions.json");
const MAX_PATCH_CHARS = parseInt(process.env.MAX_PATCH_CHARS || "3000", 10);

const MODEL = "gpt-4o-mini";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function fallbackSuggestions(files) {
  const list = [];

  for (const f of files) {
    const name = f.filename.toLowerCase();

    if (name.includes("login") || name.includes("auth")) {
      list.push(
        "Test login success with valid inputs",
        "Test login failure with wrong password",
        "Test login failure with empty fields",
        "Test behavior when API returns 500",
        "Validate error messages",
        "Test logout clears session"
      );
    } else if (name.includes("dashboard")) {
      list.push(
        "Verify dashboard loads correct user data",
        "Test empty dataset behavior",
        "Test slow API response handling",
        "Test component rendering with mock data"
      );
    } else if (name.includes("utils")) {
      list.push(
        "Verify utility functions for null, undefined, empty cases",
        "Validate output types and boundaries"
      );
    } else {
      list.push(`General tests for ${f.filename}`);
    }
  }

  return [...new Set(list)];
}

function buildPrompt(pr) {
  let fileSection = "";

  for (const f of pr.files) {
    const patch = f.patch
      ? f.patch.slice(0, MAX_PATCH_CHARS)
      : "(patch not available)";

    fileSection += `
File: ${f.filename}
Status: ${f.status}
Patch snippet:
${patch}

`;
  }

  return `
You are a senior QA engineer.

Analyze this pull request and produce 8–12 test cases including:
- positive tests
- negative tests
- edge cases
- error handling

Return ONLY a JSON array (no explanation).

PR Title: ${pr.title}
Author: ${pr.author}

${fileSection}
`;
}

async function analyzePRs() {
  if (!fs.existsSync(PR_FILE)) {
    console.error("Run get-pr-files.js first");
    return;
  }

  const data = JSON.parse(fs.readFileSync(PR_FILE));

  const results = [];

  for (const pr of data) {
    console.log(`Analyzing PR #${pr.pr_number}: ${pr.title}`);

    const prompt = buildPrompt(pr);

    try {
      const ai = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: "You generate test cases." },
          { role: "user", content: prompt },
        ],
        max_tokens: 600,
        temperature: 0,
      });

      const text = ai.choices[0].message.content.trim();

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text
          .split("\n")
          .map((x) => x.replace(/^- /, "").trim())
          .filter(Boolean);
      }

      results.push({
        pr_number: pr.pr_number,
        title: pr.title,
        suggestions: parsed,
        source: "openai",
      });

      console.log("AI Suggestions:");
      parsed.forEach((x) => console.log("- " + x));
    } catch (err) {
      console.error("AI FAILED — using mock suggestions");

      const mock = fallbackSuggestions(pr.files);

      results.push({
        pr_number: pr.pr_number,
        title: pr.title,
        suggestions: mock,
        source: "mock",
      });

      mock.forEach((x) => console.log("- " + x));
    }

    console.log("---------------------------------------\n");
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(results, null, 2));
  console.log("Saved → data/pr-ai-suggestions.json");
}

analyzePRs();
