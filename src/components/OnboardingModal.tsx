import { useState, useEffect, createContext, useContext, type ReactNode, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Sparkles, Shield, Mountain, ArrowRight, Mail, ListChecks } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserName } from "@/contexts/UserNameContext";
import { JastAvatar } from "./JastAvatar";
import { useJast, type JastTone } from "@/contexts/JastContext";
import { cn } from "@/lib/utils";

const ONBOARDING_KEY = "focusflow-onboarding-complete";

type OnboardingContextValue = {
  openOnboarding: (initialStep?: number) => void;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error("useOnboarding must be used within OnboardingProvider");
  return context;
};

const TONES: { id: JastTone; label: string; desc: string }[] = [
  { id: "warm", label: "Warm Mentor", desc: "Soft, validating, mindful" },
  { id: "energetic", label: "Best Friend", desc: "Upbeat, playful, hype" },
  { id: "coach", label: "Calm Coach", desc: "Focused, structured, kind" },
];

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const { userName, updateUserName } = useUserName();
  const { settings, updateSettings } = useJast();

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      setIsOpen(true);
      setStep(1);
      setName("");
    }
  }, []);

  const openOnboarding = useCallback(
    (initialStep = 1) => {
      setStep(initialStep);
      setIsOpen(true);
      setName(userName || "");
    },
    [userName]
  );

  const handleComplete = () => {
    if (name.trim()) {
      updateUserName(name.trim());
      localStorage.setItem(ONBOARDING_KEY, "true");
      setIsOpen(false);
    }
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else handleComplete();
  };

  return (
    <OnboardingContext.Provider value={{ openOnboarding }}>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" hideCloseButton>
          <DialogHeader>
            {step === 1 && (
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="space-y-2 flex-1">
                  <DialogTitle className="text-xl">Hi there! I'm JAST</DialogTitle>
                  <p className="text-muted-foreground">
                    Your daily companion for managing tasks, staying focused, and wrapping up each day with clarity.
                  </p>
                </div>
                <JastAvatar size={140} className="shadow-lg ring-1 ring-black/5 shrink-0" />
              </div>
            )}
            {step === 2 && (
              <DialogTitle className="text-xl mb-2">Meet your AI companion</DialogTitle>
            )}
            {step === 3 && (
              <DialogTitle className="text-xl mb-2">What should I call you?</DialogTitle>
            )}
          </DialogHeader>

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-3 py-2">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                  <ListChecks className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Simple Daily Tasks</p>
                    <p className="text-xs text-muted-foreground">
                      Pick a few important tasks each morning. Use the brain dump for stray thoughts so they don't break your flow
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                  <Mountain className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Immersive Focus Mode</p>
                    <p className="text-xs text-muted-foreground">
                      Enter a full-screen zen space with scenic landscapes, a Pomodoro timer, and your own YouTube music to stay in the zone
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                  <Mail className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">End-of-Day Summary</p>
                    <p className="text-xs text-muted-foreground">
                      Review what you accomplished, reflect on your day, and optionally receive a summary report by email
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                  <Shield className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">100% Private & Local</p>
                    <p className="text-xs text-muted-foreground">
                      No account, no tracking. Everything lives in your browser. Only the optional summary email — and, if you enable the AI companion, your chat messages sent to the AI provider — leave your device
                    </p>
                  </div>
                </div>
              </div>
              <Button onClick={handleNext} className="w-full gap-2">
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/50">
                <div className="flex items-center gap-2.5">
                  <JastAvatar size={32} />
                  <div>
                    <p className="font-medium text-sm leading-tight">Enable JAST companion</p>
                    <p className="text-xs text-muted-foreground leading-tight">Chat, nudges & gentle help</p>
                  </div>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(v) => updateSettings({ enabled: v })}
                />
              </div>

              {settings.enabled && (
                <div className="space-y-3 animate-fade-in">
                  <div>
                    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Personality</Label>
                    <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                      {TONES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => updateSettings({ tone: t.id })}
                          className={cn(
                            "text-left rounded-lg border px-2 py-1.5 transition-all",
                            settings.tone === t.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:bg-muted"
                          )}
                        >
                          <div className="text-xs font-medium leading-tight">{t.label}</div>
                          <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{t.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-2 border-t">
                    <Label className="col-span-2 text-[10px] uppercase tracking-wide text-muted-foreground">What can JAST see?</Label>
                    <Row label="Today's tasks" checked={settings.shareTasks} onChange={(v) => updateSettings({ shareTasks: v })} />
                    <Row label="Backlog" checked={settings.shareBacklog} onChange={(v) => updateSettings({ shareBacklog: v })} />
                    <Row label="Brain dump" checked={settings.shareBrainDump} onChange={(v) => updateSettings({ shareBrainDump: v })} />
                    <Row label="Progress today" checked={settings.shareProgress} onChange={(v) => updateSettings({ shareProgress: v })} />
                  </div>

                  <div className="grid grid-cols-1 gap-y-1 pt-2 border-t">
                    <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Proactive nudges</Label>
                    <Row label="Comment after task done" checked={settings.commentOnTaskDone} onChange={(v) => updateSettings({ commentOnTaskDone: v })} />
                    <Row label="Break when timer ends" checked={settings.commentOnTimerEnd} onChange={(v) => updateSettings({ commentOnTimerEnd: v })} />
                  </div>
                </div>
              )}

              <Button onClick={handleNext} className="w-full gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                I'd love to personalize your experience. What's your first name or nickname?
              </p>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
                className="text-center text-lg py-6"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim()) handleComplete();
                }}
                autoFocus
              />
              <Button onClick={handleComplete} className="w-full gap-2" disabled={!name.trim()}>
                Let's Begin <Sparkles className="w-4 h-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {children}
    </OnboardingContext.Provider>
  );
}

function Row({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
