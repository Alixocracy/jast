// Lovable AI streaming chat for JAST companion
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TONE_PROMPTS: Record<string, string> = {
  warm:
    "You are JAST, a warm and gentle mindfulness mentor. Your tone is soft, validating, and kind — like a calm yoga teacher. Use gentle encouragement, never pressure. Keep replies short (1-3 sentences usually).",
  energetic:
    "You are JAST, an upbeat, playful best-friend companion. Your tone is fun, casual, and full of hype-girl energy. Celebrate wins enthusiastically. Keep replies short and punchy.",
  coach:
    "You are JAST, a calm professional productivity coach. Your tone is focused, structured, and empathetic. Offer concrete next steps and gentle accountability. Keep replies concise.",
};

function buildSystemPrompt(tone: string, context: any, userName?: string) {
  const base = TONE_PROMPTS[tone] || TONE_PROMPTS.warm;
  const nameLine = userName
    ? `The user's name is ${userName}. Address them by name occasionally, naturally.`
    : "";

  const ctxParts: string[] = [];
  if (context?.tasks) {
    ctxParts.push(
      `Today's tasks (JSON):\n${JSON.stringify(context.tasks, null, 2)}`,
    );
  }
  if (context?.backlog) {
    ctxParts.push(`Backlog:\n${JSON.stringify(context.backlog, null, 2)}`);
  }
  if (context?.brainDump) {
    ctxParts.push(`Brain dump:\n${JSON.stringify(context.brainDump, null, 2)}`);
  }
  if (context?.progress) {
    ctxParts.push(`Progress today: ${JSON.stringify(context.progress)}`);
  }

  const tools = `
You can call these tools when the user asks:
- add_task(text, color?) — add a task to today's list
- complete_task(id) — mark a task done
- edit_task(id, text) — edit task text
- delete_task(id) — remove task
- add_to_backlog(text) — add to backlog
- add_brain_dump(text) — add a brain dump entry

Only call tools when the user explicitly asks you to. For chat/encouragement, just reply normally.
Always keep responses short, warm, and human. Avoid lists unless asked.`;

  return [
    base,
    nameLine,
    ctxParts.length ? `\nContext you have access to:\n${ctxParts.join("\n\n")}` : "",
    tools,
  ]
    .filter(Boolean)
    .join("\n\n");
}

const TOOLS = [
  {
    type: "function",
    function: {
      name: "add_task",
      description: "Add a new task to today's task list",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string" },
          color: { type: "string" },
        },
        required: ["text"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_task",
      description: "Mark a task as completed by id",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "edit_task",
      description: "Edit a task's text",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          text: { type: "string" },
        },
        required: ["id", "text"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_task",
      description: "Delete a task by id",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_to_backlog",
      description: "Add an item to the backlog",
      parameters: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_brain_dump",
      description: "Add a thought to the brain dump",
      parameters: {
        type: "object",
        properties: { text: { type: "string" } },
        required: ["text"],
        additionalProperties: false,
      },
    },
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, tone, context, userName, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const system = buildSystemPrompt(tone || "warm", context || {}, userName);

    // Non-streaming mode for proactive nudges (short single message)
    if (mode === "nudge") {
      const resp = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: system },
              ...(messages || []),
            ],
          }),
        },
      );
      if (!resp.ok) {
        const t = await resp.text();
        return new Response(JSON.stringify({ error: t }), {
          status: resp.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content ?? "";
      return new Response(JSON.stringify({ text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Streaming chat
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "system", content: system }, ...messages],
          tools: TOOLS,
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached. Try again shortly." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Add credits in Lovable workspace.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("jast-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
