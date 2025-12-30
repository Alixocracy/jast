import { Header } from "@/components/Header";
import { Affirmation } from "@/components/Affirmation";
import { FocusTimer } from "@/components/FocusTimer";
import { TaskList } from "@/components/TaskList";
import { BrainDump } from "@/components/BrainDump";
import { QuickActions } from "@/components/QuickActions";
import { FocusModeProvider, useFocusMode } from "@/contexts/FocusModeContext";
import { DreamyFocusOverlay } from "@/components/DreamyFocusOverlay";
import { OnboardingProvider } from "@/components/OnboardingModal";
import { EndOfDaySection } from "@/components/EndOfDaySection";
import { UserNameProvider } from "@/contexts/UserNameContext";

const IndexContent = () => {
  const { isFocusMode } = useFocusMode();

  return (
    <div className="min-h-screen bg-background relative">
      {/* Dreamy focus overlay */}
      <DreamyFocusOverlay />

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative">
        <Header />
        
        <div className="mb-6">
          <Affirmation />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            {/* Hide timer in normal view when focus mode is active */}
            {!isFocusMode && <FocusTimer />}
            <QuickActions />
          </div>
          
          <div className="space-y-6">
            <TaskList />
            <BrainDump />
          </div>
        </div>

        {/* End of Day Section */}
        <div className="mt-6">
          <EndOfDaySection />
        </div>

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Remember: your brain is unique, not broken. 💚</p>
        </footer>
      </div>
    </div>
  );
};

const Index = () => {
  return (
    <UserNameProvider>
      <OnboardingProvider>
        <FocusModeProvider>
          <IndexContent />
        </FocusModeProvider>
      </OnboardingProvider>
    </UserNameProvider>
  );
};

export default Index;
