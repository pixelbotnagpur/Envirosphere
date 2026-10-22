# MCP Policy (treat every server as third-party access to your systems)

## What may be connected
- Approved MCP servers only. Adding a new server is a reviewed change (like a dependency).
- Team-shared servers live in project `.mcp.json` (committed). Personal/experimental servers
  use local scope (`claude mcp add` without `--scope project`) and are never committed.

## Credentials & secrets
- **Never hardcode tokens/DSNs in `.mcp.json`.** Use `${ENV_VAR}` placeholders; real values
  live in `.env` (gitignored). Provide `.env.example` with empty keys.
- **Least privilege, read-only first.** DB access uses a **read-only role** against a
  **non-prod / analytics replica** — never a prod read-write role.
- Prefer remote **HTTP + OAuth** servers over stdio where possible: a stdio server runs as a
  child process with your full user privileges — anything it can read, the model can read.

## Data safety
- No DB in this project. If one is added, any DB MCP uses a read-only role on a
  non-prod replica. Never expose form submissions/PII through an MCP.

## Supply chain & context
- **Pin exact versions**; never `npx <pkg>@latest` for an MCP server (rug-pull risk).
- Keep it to ~3–5 servers. Each connected server loads tool definitions into context; more
  servers = smaller effective window. Rely on default deferred/Tool-Search loading.
