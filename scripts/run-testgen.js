import fs from "fs";
import path from "path";
import { Octokit } from "@octokit/rest";
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prNumber = process.env.PR_NUMBER;
const repoFull = process.env.REPO;
const [owner, repo] = repoFull.split("/");

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

console.log(`🔍 Running AI TestGen for PR #${prNumber}`);

// 1. Fetch PR diff
const diff = (
  await octokit.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: { format: "diff" },
  })
).data;

console.log("📄 Diff fetched.");

// 2. Ask OpenAI for test cases + Cypress script
console.log("🤖 Generating AI test cases & script...");

const prompt = `
You are a Senior QA Automation Engineer.

Given the following GitHub PR diff, generate:

1. Three smoke tests
2. Three negative tests
3. Three edge-case tests
4. A Cypress E2E test script that covers the changed functionality

Return ONLY JSON in this exact format:

{
  "testCases": {
    "smoke": [],
    "negative": [],
    "edge": []
  },
  "script": ""
}

PR DIFF:
${diff}
`;

let resultRaw;
try {
  const result = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });

  resultRaw = result.choices[0].message.content.trim();
} catch (err) {
  console.error("❌ OpenAI error:", err);
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(resultRaw);
} catch (err) {
  console.error("❌ JSON parse error:", err);
  console.error("RAW:", resultRaw);
  process.exit(1);
}

const { testCases, script } = parsed;

console.log("✅ AI data generated.");

// Format test cases
const flatTests = [
  ...testCases.smoke,
  ...testCases.negative,
  ...testCases.edge,
];

// 3. Build PR comment
const commentBody = `
### 🔍 **AI PR TestGen Report**

#### 🧪 **Generated Test Cases**
${flatTests.map((t) => `- ${t}`).join("\n")}

---

#### 🧪 **Generated Cypress Script**

\`\`\`js
${script}
\`\`\`

---

🧠 _Generated automatically by AI TestGen during PR checks._
`;

console.log("📝 Posting comment to GitHub...");

// 4. Post comment to PR
await octokit.issues.createComment({
  owner,
  repo,
  issue_number: prNumber,
  body: commentBody,
});

console.log("🎉 Comment posted successfully!");
