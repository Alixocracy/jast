import { useState, useEffect, createContext, useContext, type ReactNode, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Heart, Target, Brain, ArrowRight } from "lucide-react";
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
                    I'm your personal wellbeing assistant, here to help you stay focused and organized throughout the day.
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
                  <Target className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Start Small</p>
                    <p className="text-xs text-muted-foreground">
                      A productive day is a set of small focused periods. Pick a few important tasks — don't try to create a perfect plan upfront
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                  <Brain className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Brain Dump</p>
                    <p className="text-xs text-muted-foreground">
                      Ideas come, distractions happen. Don't let them grab your attention — put them in the brain dump and think about them later
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
                  <Heart className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">No Account Needed</p>
                    <p className="text-xs text-muted-foreground">
                      Just start using it! Your data stays safe in your browser. Only the optional summary email goes through the server
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
