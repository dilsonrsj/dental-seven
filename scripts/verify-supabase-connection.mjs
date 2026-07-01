/**
 * Verifica PAT Supabase e conectividade MCP antes de usar no Cursor.
 * Logs de debug → debug-085b0e.log (session 085b0e)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const DEBUG_ENDPOINT =
  "http://127.0.0.1:7393/ingest/cd5094a4-57ea-4a23-8970-5fe666743227";
const SESSION_ID = "085b0e";
const LOG_FILE = path.join(process.cwd(), "debug-085b0e.log");

function debugLog(hypothesisId, message, data = {}) {
  const entry = {
    sessionId: SESSION_ID,
    hypothesisId,
    location: "scripts/verify-supabase-connection.mjs",
    message,
    data,
    timestamp: Date.now(),
    runId: "verify-mcp",
  };
  // #region agent log
  fetch(DEBUG_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": SESSION_ID,
    },
    body: JSON.stringify(entry),
  }).catch(() => {});
  // #endregion
  try {
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + "\n");
  } catch {
    /* ignore */
  }
}

const secretsDir = path.join(os.homedir(), ".cursor", "secrets", "supabase");
const tokenPath = path.join(secretsDir, "access-token.txt");
const projectRefPath = path.join(secretsDir, "project-ref.txt");
const globalMcpPath = path.join(os.homedir(), ".cursor", "mcp.json");
const projectMcpPath = path.join(process.cwd(), ".cursor", "mcp.json");

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, "utf8").trim();
  } catch {
    return null;
  }
}

async function main() {
  console.log("=== Verificação Supabase MCP (Dental Seven) ===\n");

  // H1: OAuth HTTP sem token (config antiga)
  const globalMcp = readFileSafe(globalMcpPath);
  const usesHttpOAuth =
    globalMcp?.includes("mcp.supabase.com/mcp") &&
    !globalMcp?.includes("supabase-mcp-launcher");
  debugLog("H1", "global mcp uses broken HTTP OAuth", {
    usesHttpOAuth,
    hasGlobalMcp: Boolean(globalMcp),
  });

  // H2: PAT ausente
  const token = readFileSafe(tokenPath);
  debugLog("H2", "PAT file check", {
    tokenPath,
    tokenPresent: Boolean(token),
    tokenLength: token?.length ?? 0,
  });

  if (!token) {
    console.error("❌ PAT ausente:", tokenPath);
    console.error("   Siga:", path.join(secretsDir, "LEIA-ME.txt"));
    process.exit(1);
  }

  // H3: PAT inválido ou expirado
  let projectsRes;
  try {
    projectsRes = await fetch("https://api.supabase.com/v1/projects", {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    debugLog("H3", "API fetch failed", { error: String(err) });
    console.error("❌ Rede/API inacessível:", err.message);
    process.exit(1);
  }

  const projectsBody = await projectsRes.text();
  debugLog("H3", "Supabase API projects response", {
    status: projectsRes.status,
    ok: projectsRes.ok,
    bodyPreview: projectsBody.slice(0, 200),
  });

  if (!projectsRes.ok) {
    console.error("❌ PAT inválido ou expirado (HTTP", projectsRes.status + ")");
    console.error("   Gere novo token em https://supabase.com/dashboard/account/tokens");
    process.exit(1);
  }

  const projects = JSON.parse(projectsBody);
  console.log("✅ PAT válido — projetos encontrados:", projects.length);
  projects.slice(0, 5).forEach((p) => {
    console.log(`   - ${p.name} (${p.id})`);
  });

  // H4: project-ref configurado
  const projectRef = readFileSafe(projectRefPath);
  debugLog("H4", "project ref scope", {
    projectRefPath,
    projectRef: projectRef ?? null,
  });
  if (projectRef) {
    const match = projects.find((p) => p.id === projectRef);
    console.log(match ? `✅ project-ref OK: ${match.name}` : "⚠️ project-ref não encontrado na conta");
  } else {
    console.log("ℹ️  project-ref.txt não configurado (MCP verá todos os projetos)");
  }

  // H5: project mcp.json presente
  const projectMcp = readFileSafe(projectMcpPath);
  debugLog("H5", "project mcp.json", { exists: Boolean(projectMcp) });

  console.log("\n✅ Pronto. Reinicie o MCP Supabase no Cursor (Settings → Tools & MCP).");
}

main().catch((err) => {
  debugLog("ERR", "unexpected error", { error: String(err) });
  console.error(err);
  process.exit(1);
});
