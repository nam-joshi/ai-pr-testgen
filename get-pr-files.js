import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { Octokit } from "@octokit/rest";

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const token = process.env.GITHUB_TOKEN;

const octokit = new Octokit({ auth: token });

const outDir = path.join(process.cwd(), "data");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function fetchPRs() {
  try {
    const { data: prs } = await octokit.pulls.list({
      owner,
      repo,
      state: "open",
      per_page: 20,
    });

    const results = [];

    for (const pr of prs) {
      const { data: files } = await octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: pr.number,
      });

      const cypressFiles = files.filter((f) =>
        f.filename.includes("cypress/")
      );

      results.push({
        pr_number: pr.number,
        title: pr.title,
        author: pr.user.login,
        files: cypressFiles.map((f) => ({
          filename: f.filename,
          patch: f.patch || "",
        })),
      });
    }

    fs.writeFileSync(
      path.join(outDir, "pr-files.json"),
      JSON.stringify(results, null, 2)
    );

    console.log("✔ PR data saved to data/pr-files.json");
  } catch (err) {
    console.error("❌ Error fetching PRs:", err);
  }
}

fetchPRs();
