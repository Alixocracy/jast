import { supabase } from "@/integrations/supabase/client";
import type { JastSettings } from "@/contexts/JastContext";
import { buildJastContext, executeJastTool, JastToolCall } from "@/lib/jastBridge";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/jast-chat`;

interface StreamArgs {
  messages: { role: "user" | "assistant"; content: string }[];
  settings: JastSettings;
  userName?: string;
  onDelta: (chunk: string) => void;
  onDone: (toolResults: string[]) => void;
  onError: (msg: string) => void;
}

export async function streamJastChat({
  messages,
  settings,
  userName,
  onDelta,
  onDone,
  onError,
}: StreamArgs) {
  const context = buildJastContext(settings);
  let resp: Response;
  try {
    resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, tone: settings.tone, context, userName }),
    });
  } catch (e) {
    onError("Network error reaching JAST.");
    return;
  }

  if (!resp.ok || !resp.body) {
    if (resp.status === 429) onError("Slow down — rate limit. Try again in a moment.");
    else if (resp.status === 402) onError("AI credits exhausted.");
    else onError("Couldn't reach JAST.");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = false;

  // Accumulate tool calls by index
  const toolCallAcc: Record<number, { name: string; args: string }> = {};

  while (!done) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buffer += decoder.decode(value, { stream: true });

    let nl: number;
    while ((nl = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") {
        done = true;
        break;
      }
      try {
        const parsed = JSON.parse(json);
        const delta = parsed.choices?.[0]?.delta;
        if (delta?.content) onDelta(delta.content);
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!toolCallAcc[idx]) toolCallAcc[idx] = { name: "", args: "" };
            if (tc.function?.name) toolCallAcc[idx].name = tc.function.name;
            if (tc.function?.arguments) toolCallAcc[idx].args += tc.function.arguments;
          }
        }
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  // Execute tool calls
  const results: string[] = [];
  for (const idx of Object.keys(toolCallAcc)) {
    const tc = toolCallAcc[Number(idx)];
    if (!tc.name) continue;
    try {
      const args = JSON.parse(tc.args || "{}");
      const result = executeJastTool({ name: tc.name as any, args } as JastToolCall);
      results.push(result);
    } catch (e) {
      results.push(`Couldn't run ${tc.name}.`);
    }
  }

  onDone(results);
}

export async function jastNudge(opts: {
  prompt: string;
  settings: JastSettings;
  userName?: string;
}): Promise<string> {
  const context = buildJastContext(opts.settings);
  const { data, error } = await supabase.functions.invoke("jast-chat", {
    body: {
      messages: [{ role: "user", content: opts.prompt }],
      tone: opts.settings.tone,
      context,
      userName: opts.userName,
      mode: "nudge",
    },
  });
  if (error) throw error;
  return (data as any)?.text ?? "";
}
