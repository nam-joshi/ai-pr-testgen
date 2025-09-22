import fs from "fs";
import dotenv from "dotenv";
dotenv.config();


// Load PR data
const prData = JSON.parse(fs.readFileSync("data/pr-files.json", "utf-8"));

// Function to generate mock AI test suggestions based on filenames
function generateMockSuggestions(files) {
  const suggestions = [];

  files.forEach(file => {
    if (file.toLowerCase().includes("login")) {
      suggestions.push(
        "✅ Test login with valid username and valid password",
        "❌ Test login with valid username and invalid password",
        "❌ Test login with invalid username and valid password",
        "❌ Test login with invalid username and invalid password",
        "🔒 Test behavior when login fields are left empty",
        "🔄 Test login session persists after refresh"
      );
    } else if (file.toLowerCase().includes("auth")) {
      suggestions.push(
        "🔐 Verify authentication token is generated correctly",
        "🚫 Test access to protected routes without login",
        "🔄 Test logout clears session/token"
      );
    } else if (file.toLowerCase().includes("dashboard")) {
      suggestions.push(
        "📊 Test that dashboard loads correctly with valid data",
        "🔄 Verify UI updates when data changes"
      );
    } else if (file.toLowerCase().includes("utils")) {
      suggestions.push(
        "🧮 Verify utility functions handle edge cases (null, undefined, 0, empty string)",
        "🔄 Test utils with both normal and extreme values"
      );
    } else {
      suggestions.push(`📝 General test coverage for ${file}`);
    }
  });

  return suggestions;
}

// Loop through each PR and print summary with mock suggestions
prData.forEach(pr => {
  console.log(`PR #${pr.pr_number}: ${pr.title}`);
  console.log(`Author: ${pr.author}`);
  console.log(`Files Changed: ${pr.files_changed.length}`);
  console.log(`Files: ${pr.files_changed.join(", ")}`);
  console.log("AI Test Suggestions:");
  const suggestions = generateMockSuggestions(pr.files_changed);
  suggestions.forEach(s => console.log("- " + s));
  console.log("------------------------------------------------");
});
