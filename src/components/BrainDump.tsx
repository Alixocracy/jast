import { useState, useEffect } from "react";
import { Brain, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Thought {
  id: string;
  text: string;
  timestamp: string;
}

const STORAGE_KEY = "focusflow-braindump";

const getStoredThoughts = (): Thought[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load thoughts from localStorage", e);
  }
  return [];
};

export function BrainDump() {
  const [thoughts, setThoughts] = useState<Thought[]>(getStoredThoughts);
  const [currentThought, setCurrentThought] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(thoughts));
  }, [thoughts]);

  const addThought = () => {
    if (currentThought.trim()) {
      setThoughts([
        { id: Date.now().toString(), text: currentThought.trim(), timestamp: new Date().toISOString() },
        ...thoughts,
      ]);
      setCurrentThought("");
    }
  };

  const deleteThought = (id: string) => {
    setThoughts(thoughts.filter((t) => t.id !== id));
  };

  const clearAll = () => {
    setThoughts([]);
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card animate-fade-in animate-delay-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Brain Dump</h2>
        </div>
        {thoughts.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Get those racing thoughts out of your head. No judgment, just dump.
      </p>

      <div className="flex gap-2 mb-4">
        <textarea
          value={currentThought}
          onChange={(e) => setCurrentThought(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              addThought();
            }
          }}
          placeholder="What's on your mind?"
          className="flex-1 px-4 py-3 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none min-h-[80px]"
        />
      </div>

      <Button onClick={addThought} className="w-full mb-4" disabled={!currentThought.trim()}>
        Dump it
      </Button>

      {/* Thought list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {thoughts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Your mind is clear ✨
          </div>
        ) : (
          thoughts.map((thought) => (
            <div
              key={thought.id}
              className="group flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <span className="flex-1 text-sm text-foreground">{thought.text}</span>
              <button
                onClick={() => deleteThought(thought.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
