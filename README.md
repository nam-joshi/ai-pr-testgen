# ai-pr-testgen
# How to run (mock mode - no API keys required)
1. Ensure Node is installed.
2. From project root:
   node analyze-pr.mjs
   # this runs the mock analyzer and writes data/pr-ai-suggestions.json

## How to run (with real APIs - DO NOT COMMIT KEYS)
1. Create a .env file in project root with:
   OPENAI_API_KEY=...
   GITHUB_TOKEN=...
2. To fetch PR files:
   node get-pr-files.js
3. To analyze (real AI):
   node analyze-pr.mjs
