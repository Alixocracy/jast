import { Header } from "@/components/Header";
import { Affirmation } from "@/components/Affirmation";
import { FocusTimer } from "@/components/FocusTimer";
import { TaskList } from "@/components/TaskList";
import { BrainDump } from "@/components/BrainDump";
import { QuickActions } from "@/components/QuickActions";
import { FocusModeProvider, useFocusMode } from "@/contexts/FocusModeContext";
import { DreamyFocusOverlay } from "@/components/DreamyFocusOverlay";

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

        {/* Timer and Tasks side by side */}
        <div className="grid gap-4 md:grid-cols-[280px_1fr] mb-6">
          {!isFocusMode && (
            <div className="md:sticky md:top-8">
              <FocusTimer />
            </div>
          )}
          <div className={!isFocusMode ? "" : "md:col-span-2"}>
            <TaskList />
          </div>
        </div>

        {/* Quick Actions and Brain Dump */}
        <div className="grid gap-6 md:grid-cols-2">
          <QuickActions />
          <BrainDump />
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
    <FocusModeProvider>
      <IndexContent />
    </FocusModeProvider>
  );
};

export default Index;
