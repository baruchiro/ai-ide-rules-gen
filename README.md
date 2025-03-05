# ESLint & AI-Powered Coding Standards Generator

This repository automates extracting **ESLint rules** and **Repomix insights**, generating a structured **LLM prompt** to improve **coding standards**.

## 📌 How It Works
1. **Extracts ESLint rules** from `.eslintrc.json`, `.eslintrc.yaml`, or `.eslintrc.yml`
2. **Extracts Repomix insights** (if available)
3. **Generates `llm-prompt.txt`** with structured data
4. **Allows manual review & AI-enhanced rules creation**

## 🚀 Usage
### 1️⃣ **Run the Script**
```bash
node generate-rules.js

