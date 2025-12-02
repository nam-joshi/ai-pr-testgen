import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const PR_FILE = "./data/pr-files.json";
const OUT_FILE = "./data/pr-ai-suggestions.json";

async function generateAISuggestions(fileName, fileContent) {
  const prompt = `
You are a senior QA automation engineer.

A Cypress test file was modified: **${fileName}**

Here is the full content:

${fileContent}

Based on this file, generate **HIGH-QUALITY**, **realistic**, **professional**
test case suggestions that expand coverage of this Cypress E2E test.

Rules:
- DO NOT mention .gitignore, package.json, locks, configs
- ONLY generate suggestions related to the Cypress test behavior
- Create 3–6 suggestions
- Make them practical and based on the website behavior

Return suggestions ONLY as bullet points.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });

  return completion.choices[0].message.content;
}

async function run() {
  const data = JSON.parse(fs.readFileSync(PR_FILE, "utf8"));
  const output = [];

  for (const pr of data) {
    const suggestions = [];

    for (const f of pr.files) {
      const ai = await generateAISuggestions(f.filename, f.content);
      suggestions.push({
        file: f.filename,
        ai_suggestions: ai
      });
    }

    output.push({
      pr_number: pr.pr_number,
      title: pr.title,
      suggestions
    });
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));
  console.log("✔ AI suggestions written to pr-ai-suggestions.json");
}

await run();
