import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Trash2, Settings as SettingsIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useJast, JastTone } from "@/contexts/JastContext";
import { useUserName } from "@/contexts/UserNameContext";
import { streamJastChat } from "@/lib/jastClient";
import { cn } from "@/lib/utils";

const TONE_LABELS: Record<JastTone, { label: string; desc: string }> = {
  warm: { label: "Warm Mentor", desc: "Soft, validating, mindful" },
  energetic: { label: "Best Friend", desc: "Upbeat, playful, hype" },
  coach: { label: "Calm Coach", desc: "Focused, structured, kind" },
};

export function JastDrawer() {
  const {
    settings,
    updateSettings,
    history,
    setHistory,
    clearHistory,
    isOpen,
    closeChat,
  } = useJast();
  const { userName } = useUserName();
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
      });
    }
  }, [isOpen, history.length]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    const userMsg = {
      id: `u-${Date.now()}`,
      role: "user" as const,
      content: text,
      timestamp: Date.now(),
    };
    const assistantId = `a-${Date.now() + 1}`;
    setHistory((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "", timestamp: Date.now() + 1 },
    ]);
    setInput("");
    setStreaming(true);

    let acc = "";
    await streamJastChat({
      messages: [...history, userMsg].map((m) => ({ role: m.role, content: m.content })),
      settings,
      userName,
      onDelta: (chunk) => {
        acc += chunk;
        setHistory((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)),
        );
      },
      onDone: (toolResults) => {
        if (toolResults.length) {
          const note = toolResults.join(" ");
          setHistory((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: (acc || "Done.") + (acc ? "\n\n" : "") + `_${note}_` }
                : m,
            ),
          );
        } else if (!acc) {
          setHistory((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: "…" } : m)),
          );
        }
        setStreaming(false);
      },
      onError: (msg) => {
        setHistory((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: `_${msg}_` } : m,
          ),
        );
        setStreaming(false);
      },
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && closeChat()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              JAST
            </SheetTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings((v) => !v)}
                aria-label="Settings"
              >
                <SettingsIcon className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearHistory}
                aria-label="Clear chat"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        {showSettings && (
          <div className="border-b bg-muted/30 px-5 py-4 space-y-4 max-h-[55vh] overflow-y-auto">
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Personality
              </Label>
              <div className="mt-2 grid grid-cols-1 gap-2">
                {(Object.keys(TONE_LABELS) as JastTone[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => updateSettings({ tone: t })}
                    className={cn(
                      "text-left rounded-lg border px-3 py-2 transition-all",
                      settings.tone === t
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    <div className="text-sm font-medium">{TONE_LABELS[t].label}</div>
                    <div className="text-xs text-muted-foreground">{TONE_LABELS[t].desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                What can JAST see?
              </Label>
              <ToggleRow
                label="Today's tasks"
                checked={settings.shareTasks}
                onChange={(v) => updateSettings({ shareTasks: v })}
              />
              <ToggleRow
                label="Backlog"
                checked={settings.shareBacklog}
                onChange={(v) => updateSettings({ shareBacklog: v })}
              />
              <ToggleRow
                label="Brain dump"
                checked={settings.shareBrainDump}
                onChange={(v) => updateSettings({ shareBrainDump: v })}
              />
              <ToggleRow
                label="Progress today"
                checked={settings.shareProgress}
                onChange={(v) => updateSettings({ shareProgress: v })}
              />
            </div>

            <div className="space-y-3 pt-2 border-t">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Proactive nudges
              </Label>
              <ToggleRow
                label="Comment after each task done"
                checked={settings.commentOnTaskDone}
                onChange={(v) => updateSettings({ commentOnTaskDone: v })}
              />
              <ToggleRow
                label="Suggest break when timer ends"
                checked={settings.commentOnTimerEnd}
                onChange={(v) => updateSettings({ commentOnTimerEnd: v })}
              />
            </div>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {history.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              Hi{userName ? ` ${userName}` : ""} — I'm JAST. Ask me anything, or
              just chat. 💚
            </div>
          )}
          {history.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : m.isNudge
                      ? "bg-accent text-accent-foreground border border-primary/30"
                      : "bg-muted text-foreground",
                )}
              >
                {m.content || (streaming ? "…" : "")}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t p-3 flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Talk to JAST…"
            rows={1}
            className="flex-1 resize-none rounded-xl bg-muted px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 max-h-32"
          />
          <Button onClick={send} size="icon" disabled={streaming || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
