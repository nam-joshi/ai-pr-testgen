import fetch from "node-fetch";

const token = process.env.GITHUB_TOKEN;

// Replace with your repo details (owner/repo)
const owner = "nam-joshi";
const repo = "ai-pr-testgen";

async function getPRs() {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls`, {
    headers: {
      "Authorization": `token ${token}`,
      "Accept": "application/vnd.github.v3+json"
    }
  });

  if (!response.ok) {
    console.error("Error:", response.status, await response.text());
    return;
  }

  const prs = await response.json();
  console.log("Open PRs:");
  prs.forEach(pr => {
    console.log(`#${pr.number}: ${pr.title}`);
  });
}

getPRs();
