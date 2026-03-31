import { useState, useEffect, createContext, useContext, type ReactNode, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Shield, Target, Mountain, ArrowRight, Mail, ListChecks } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserName } from "@/contexts/UserNameContext";
import { JastAvatar } from "./JastAvatar";

const ONBOARDING_KEY = "focusflow-onboarding-complete";

type OnboardingContextValue = {
  openOnboarding: (initialStep?: number) => void;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
};

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const { userName, updateUserName } = useUserName();

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasCompletedOnboarding) {
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
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  return (
    <OnboardingContext.Provider value={{ openOnboarding }}>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" hideCloseButton>
          <DialogHeader>
            {step === 1 ? (
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="space-y-2 flex-1">
                  <DialogTitle className="text-xl">Hi there! I'm JAST</DialogTitle>
                  <p className="text-muted-foreground">
                    Your daily companion for managing tasks, staying focused, and wrapping up each day with clarity.
                  </p>
                </div>
                <JastAvatar size={140} className="shadow-lg ring-1 ring-black/5 shrink-0" />
              </div>
            ) : (
              <div className="flex items-center mb-2">
                <DialogTitle className="text-xl">What should I call you?</DialogTitle>
              </div>
            )}
          </DialogHeader>

          {step === 1 ? (
            <div className="space-y-4">
              <div className="space-y-3 py-4">
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
                      No account, no tracking. Everything lives in your browser. Only the optional summary email leaves your device
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={handleNext} className="w-full gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ) : (
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
                  if (e.key === "Enter" && name.trim()) {
                    handleComplete();
                  }
                }}
                autoFocus
              />

              <Button 
                onClick={handleComplete} 
                className="w-full gap-2"
                disabled={!name.trim()}
              >
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
