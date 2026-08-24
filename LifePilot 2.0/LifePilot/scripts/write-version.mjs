import { mkdir, writeFile } from "node:fs/promises";

const version = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || process.env.npm_package_version || `local-${Date.now()}`;
const payload = {
  version,
  generatedAt: new Date().toISOString()
};

await mkdir("public", { recursive: true });
await writeFile("public/version.json", JSON.stringify(payload), "utf8");
console.log(`[LifePilot] build version: ${version}`);
