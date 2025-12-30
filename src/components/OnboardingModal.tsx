import { useState, useEffect } from "react";
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

const ONBOARDING_KEY = "focusflow-onboarding-complete";

export function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const { updateUserName } = useUserName();

  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(ONBOARDING_KEY);
    if (!hasCompletedOnboarding) {
      setIsOpen(true);
    }
  }, []);

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
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl gradient-calm flex items-center justify-center shadow-soft">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="text-xl">
              {step === 1 ? "Hi there! I'm JAST" : "What should I call you?"}
            </DialogTitle>
          </div>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              I'm your personal wellbeing assistant, here to help you stay focused and organized throughout the day.
            </p>
            
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
  );
}
