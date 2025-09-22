// get-pr-files.js
const { Octokit } = require("@octokit/rest");
const fs = require("fs");

// 1️⃣ Setup Octokit with your GitHub Personal Access Token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // Store your token in environment variable for security
});

// 2️⃣ Define the repo and owner
const owner = "nam-joshi"; // replace with repo owner
const repo = "ai-pr-testgen";        // replace with repo name

// 3️⃣ Function to fetch PRs and their changed files
async function fetchPRFiles() {
  try {
    const { data: prs } = await octokit.pulls.list({
      owner,
      repo,
      state: "open", // or "all" to fetch all PRs
    });

    const result = [];

    for (const pr of prs) {
      const { data: files } = await octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: pr.number,
      });

      const fileNames = files.map(file => file.filename);

      result.push({
        pr_number: pr.number,
        title: pr.title,
        author: pr.user.login,
        files_changed: fileNames,
      });
    }

    // Save result to data folder
    fs.writeFileSync("data/pr-files.json", JSON.stringify(result, null, 2));
    console.log("PR files saved to data/pr-files.json");

  } catch (error) {
    console.error("Error fetching PRs:", error);
  }
}

// Run the function
fetchPRFiles();
