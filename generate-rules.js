const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

// Helper function to log progress
function logStep(step) {
  console.log(`\n🔹 ${step}...\n`);
}

// --- 1️⃣ Run Repomix and Save Output ---
logStep("Step 1: Running Repomix to analyze the codebase");
try {
  const repomixOutputPath = "repomix-output.txt";
  require("child_process").execSync(`repomix analyze --output ${repomixOutputPath}`, { stdio: "inherit" });
  console.log("✅ Repomix analysis complete.");
} catch (error) {
  console.error("❌ Repomix failed. Proceeding without its output.");
}

// --- 2️⃣ Load Repomix Output ---
logStep("Step 2: Loading Repomix output");
const repomixFilePath = path.resolve(__dirname, "repomix-output.txt");
let repomixData = "No repomix data found.";

if (fs.existsSync(repomixFilePath)) {
  repomixData = fs.readFileSync(repomixFilePath, "utf-8");
  console.log("✅ Repomix output loaded.");
} else {
  console.log("⚠️ Repomix output not found. Proceeding without it.");
}

// --- 3️⃣ Load ESLint Config (Supports all ESLint config formats in priority order) ---
logStep("Step 3: Extracting ESLint rules");
let eslintConfig = {};

// Define config files in priority order
const configFiles = [
  { path: path.resolve(__dirname, ".eslintrc.js"), loader: (p) => require(p) },
  { path: path.resolve(__dirname, ".eslintrc.cjs"), loader: (p) => require(p) },
  { path: path.resolve(__dirname, ".eslintrc.yaml"), loader: (p) => yaml.load(fs.readFileSync(p, "utf-8")) },
  { path: path.resolve(__dirname, ".eslintrc.yml"), loader: (p) => yaml.load(fs.readFileSync(p, "utf-8")) },
  { path: path.resolve(__dirname, ".eslintrc.json"), loader: (p) => JSON.parse(fs.readFileSync(p, "utf-8")) },
  {
    path: path.resolve(__dirname, "package.json"),
    loader: (p) => {
      const pkg = JSON.parse(fs.readFileSync(p, "utf-8"));
      if (!pkg.eslintConfig) throw new Error("No eslintConfig in package.json");
      return pkg.eslintConfig;
    }
  }
];

// Try loading configs in priority order
let configLoaded = false;
for (const config of configFiles) {
  if (fs.existsSync(config.path)) {
    try {
      eslintConfig = config.loader(config.path);
      console.log(`✅ ESLint config loaded from ${path.basename(config.path)}`);
      configLoaded = true;
      break;
    } catch (error) {
      console.log(`⚠️ Failed to load config from ${path.basename(config.path)}: ${error.message}`);
    }
  }
}

if (!configLoaded) {
  console.error("❌ No valid ESLint config found! Ensure one of these exists and is valid:");
  console.error("   - .eslintrc.js");
  console.error("   - .eslintrc.cjs");
  console.error("   - .eslintrc.yaml");
  console.error("   - .eslintrc.yml");
  console.error("   - .eslintrc.json");
  console.error("   - eslintConfig in package.json");
  process.exit(1);
}

// Format ESLint rules for readability
const formattedEslintRules = JSON.stringify(eslintConfig.rules || {}, null, 2);

// --- 4️⃣ Load React Version from package.json ---
logStep("Step 4: Checking React version in package.json");
const packageJsonPath = path.resolve(__dirname, "package.json");
let reactVersion = "not installed";

if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  reactVersion = packageJson.dependencies?.react || packageJson.devDependencies?.react || "not installed";
  console.log(`✅ React version detected: ${reactVersion}`);
} else {
  console.log("⚠️ package.json not found. React version unknown.");
}

// --- 5️⃣ Generate LLM Prompt ---
logStep("Step 5: Generating LLM prompt");

const llmPrompt = `# **Task for AI**
You are an expert in software engineering best practices. Given the following information:

## **Extracted ESLint Rules**
\`\`\`json
${formattedEslintRules}
\`\`\`

## **Repomix Insights (if available)**
\`\`\`
${repomixData.substring(0, 2000)}
\`\`\`

## **Your Task**
Generate:
1. **Improved \`.cursorrules\`**
2. **Any additional best practices** for coding style, testing, architecture, and security.
`;

fs.writeFileSync("llm-prompt.txt", llmPrompt);
console.log("\n✅ LLM prompt saved as 'llm-prompt.txt'.");
console.log("📌 Open 'llm-prompt.txt', copy its content, and paste it into an LLM (ChatGPT, Claude, or OpenAI API Playground).");

