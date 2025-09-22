// analyze-pr.mjs
import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import OpenAI from "openai";

// Setup OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Load PR data
const prData = JSON.parse(fs.readFileSync("data/pr-files.json", "utf-8"));

// Array to store AI suggestions
const aiSuggestions = [];

async function analyzePRs() {
  for (const pr of prData) {
    console.log(`\nPR #${pr.pr_number}: ${pr.title}`);
    console.log(`Author: ${pr.author}`);
    console.log(`Files Changed: ${pr.files_changed.join(", ")}`);

    const prompt = `Analyze this PR and suggest possible test cases for the changed files: ${pr.files_changed.join(", ")}`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an expert QA engineer." },
          { role: "user", content: prompt }
        ],
        max_tokens: 200
      });

      const suggestion = response.choices[0].message.content.trim();
      console.log("AI Test Suggestions:\n", suggestion);

      aiSuggestions.push({
        pr_number: pr.pr_number,
        title: pr.title,
        author: pr.author,
        files_changed: pr.files_changed,
        ai_suggestions: suggestion
      });

    } catch (error) {
      console.error("Error generating AI suggestions:", error);
    }

    console.log("------------------------------------------------");
  }

  // Save AI suggestions to JSON
  fs.writeFileSync("data/pr-ai-suggestions.json", JSON.stringify(aiSuggestions, null, 2));
  console.log("\n✅ AI suggestions saved to data/pr-ai-suggestions.json");
}

// Run analysis
analyzePRs();
