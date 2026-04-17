# @flixier/asana-mcp

Minimal read-only MCP server exposing Asana task context, used by `claude-code-action` during PR reviews.

## Tools

- `get_task(task_id)` — title, notes, parent reference, custom fields
- `get_task_subtasks(task_id)` — subtasks with title + notes
- `get_task_comments(task_id)` — user comments (filtered from stories)
- `get_task_attachments(task_id)` — attachments with URLs
- `get_parent_task(task_id)` — parent task details

## Auth

Set `ASANA_ACCESS_TOKEN` env var to a Personal Access Token from Asana (My Settings → Apps → Developer Apps).

## Usage in Claude Code / claude-code-action

```json
{
  "mcpServers": {
    "asana": {
      "command": "npx",
      "args": ["-y", "github:flixier/asana-mcp"],
      "env": {
        "ASANA_ACCESS_TOKEN": "${ASANA_TOKEN}"
      }
    }
  }
}
```

## Local testing

```bash
npm install
ASANA_ACCESS_TOKEN=your_token npx @modelcontextprotocol/inspector node index.js
```
