const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const lockFiles = ["package-lock.json", "yarn.lock"];

for (const lockFile of lockFiles) {
  const fullPath = path.join(root, lockFile);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

const agent = process.env.npm_config_user_agent || "";
if (!agent.startsWith("pnpm/")) {
  console.error("Use pnpm instead");
  process.exit(1);
}
