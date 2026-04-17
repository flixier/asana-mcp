#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE = "https://app.asana.com/api/1.0";
const TOKEN = process.env.ASANA_ACCESS_TOKEN;

if (!TOKEN) {
  console.error("Missing ASANA_ACCESS_TOKEN env var");
  process.exit(1);
}

async function asanaGet(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Asana API ${res.status}: ${body}`);
  }
  const json = await res.json();
  return json.data;
}

function textResult(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

const server = new McpServer({ name: "asana-mcp", version: "1.0.0" });

const taskIdSchema = { task_id: z.string().describe("Asana task GID") };

server.registerTool(
  "get_task",
  {
    description:
      "Fetch the main fields of an Asana task: title, description (notes), parent reference, and custom fields.",
    inputSchema: taskIdSchema,
  },
  async ({ task_id }) => {
    const task = await asanaGet(
      `/tasks/${task_id}?opt_fields=name,notes,parent.name,parent.gid,custom_fields.name,custom_fields.display_value`
    );
    return textResult(task);
  }
);

server.registerTool(
  "get_task_subtasks",
  {
    description:
      "List all subtasks of an Asana task with their title and description.",
    inputSchema: taskIdSchema,
  },
  async ({ task_id }) => {
    const subtasks = await asanaGet(
      `/tasks/${task_id}/subtasks?opt_fields=gid,name,notes`
    );
    return textResult(subtasks);
  }
);

server.registerTool(
  "get_task_comments",
  {
    description:
      "List all user-authored comments on an Asana task (stories of type=comment).",
    inputSchema: taskIdSchema,
  },
  async ({ task_id }) => {
    const stories = await asanaGet(
      `/tasks/${task_id}/stories?opt_fields=type,text,created_at,created_by.name`
    );
    const comments = stories.filter((s) => s.type === "comment");
    return textResult(comments);
  }
);

/*
// Attachments tool disabled for now.
// Re-enable when we want Claude to see task files/links. Consider also fetching
// Asana-hosted images as inline image content blocks (adds ~1-3k tokens each).
server.registerTool(
  "get_task_attachments",
  {
    description:
      "List attachments (files, external links) on an Asana task with their URLs.",
    inputSchema: taskIdSchema,
  },
  async ({ task_id }) => {
    const attachments = await asanaGet(
      `/tasks/${task_id}/attachments?opt_fields=name,download_url,view_url,resource_subtype,host`
    );
    return textResult(attachments);
  }
);
*/

server.registerTool(
  "get_parent_task",
  {
    description:
      "Fetch the parent task of a subtask, returning the same fields as get_task.",
    inputSchema: {
      task_id: z.string().describe("Asana task GID of the child/subtask"),
    },
  },
  async ({ task_id }) => {
    const task = await asanaGet(`/tasks/${task_id}?opt_fields=parent.gid`);
    if (!task.parent?.gid) {
      return textResult({ error: "Task has no parent" });
    }
    const parent = await asanaGet(
      `/tasks/${task.parent.gid}?opt_fields=name,notes,parent.name,parent.gid,custom_fields.name,custom_fields.display_value`
    );
    return textResult(parent);
  }
);

await server.connect(new StdioServerTransport());
