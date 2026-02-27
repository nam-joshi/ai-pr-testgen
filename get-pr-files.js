// get-pr-files.js (ESM)
import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { Octokit } from "@octokit/rest";

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

// Ensure output directory exists
const outDir = path.join(process.cwd(), "data");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function fetchOpenPRs() {
  try {
    const { data: prs } = await octokit.pulls.list({
      owner,
      repo,
      state: "open",
      per_page: 100,
    });

    const results = [];

    for (const pr of prs) {
      const { data: files } = await octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: pr.number,
      });

      const normalizedFiles = files.map((f) => ({
        filename: f.filename,
        status: f.status,
        patch: f.patch || "",
        additions: f.additions,
        deletions: f.deletions,
        sha: f.sha,
        raw_url: f.raw_url,
      }));

      results.push({
        pr_number: pr.number,
        title: pr.title,
        author: pr.user?.login || "",
        html_url: pr.html_url,
        created_at: pr.created_at,
        files: normalizedFiles,
      });
    }

    const outPath = path.join(outDir, "pr-files.json");
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
    console.log("✔ PR files saved to data/pr-files.json");
  } catch (err) {
    console.error("❌ Error fetching PRs:", err.message || err);
    process.exitCode = 1;
  }
}

fetchOpenPRs();
