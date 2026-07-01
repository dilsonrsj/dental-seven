/**
 * Sincroniza ~/.cursor/mcp.json com PAT + project-ref dos arquivos em secrets.
 * Necessário porque MCP stdio exige que o npx seja o processo raiz (sem wrapper).
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const secretsDir = path.join(os.homedir(), ".cursor", "secrets", "supabase");
const mcpPath = path.join(os.homedir(), ".cursor", "mcp.json");
const logPath = path.join(os.homedir(), ".cursor", "debug-085b0e.log");

function debugLog(hypothesisId, message, data) {
  const entry = {
    sessionId: "085b0e",
    hypothesisId,
    location: "sync-supabase-mcp-config.mjs",
    message,
    data,
    timestamp: Date.now(),
    runId: "sync-mcp",
  };
  try {
    fs.appendFileSync(logPath, JSON.stringify(entry) + "\n");
  } catch {
    /* ignore */
  }
}

const token = fs.readFileSync(path.join(secretsDir, "access-token.txt"), "utf8").trim();
const projectRef = fs
  .readFileSync(path.join(secretsDir, "project-ref.txt"), "utf8")
  .trim();

const config = JSON.parse(fs.readFileSync(mcpPath, "utf8"));
const args = ["-y", "@supabase/mcp-server-supabase@latest"];
if (projectRef) args.push(`--project-ref=${projectRef}`);

config.mcpServers.supabase = {
  command: "npx",
  args,
  env: {
    SUPABASE_ACCESS_TOKEN: token,
  },
};

fs.writeFileSync(mcpPath, JSON.stringify(config, null, 2) + "\n", "utf8");

debugLog("H6", "mcp.json synced with direct npx launch", {
  projectRef,
  tokenLength: token.length,
  args,
});

console.log("✅ ~/.cursor/mcp.json atualizado (npx direto, sem wrapper)");
console.log("   project-ref:", projectRef || "(todos os projetos)");
console.log("\n→ Reinicie o MCP Supabase no Cursor (Settings → Tools & MCP)");
