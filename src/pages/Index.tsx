import { Header } from "@/components/Header";
import { Affirmation } from "@/components/Affirmation";
import { FocusTimer } from "@/components/FocusTimer";
import { TaskList } from "@/components/TaskList";
import { BrainDump } from "@/components/BrainDump";
import { QuickActions } from "@/components/QuickActions";
import { FocusModeProvider, useFocusMode } from "@/contexts/FocusModeContext";
import { X } from "lucide-react";

const IndexContent = () => {
  const { isFocusMode, focusedTask, setFocusedTask } = useFocusMode();

  return (
    <div className="min-h-screen bg-background relative">
      {/* Focus mode overlay */}
      {isFocusMode && (
        <div 
          className="fixed inset-0 bg-background/85 backdrop-blur-[3px] z-10 animate-fade-in"
          onClick={() => setFocusedTask(null)}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative">
        <div className={isFocusMode ? "opacity-25 transition-opacity duration-300" : ""}>
          <Header />
        </div>
        
        <div className={`mb-6 ${isFocusMode ? "opacity-25 transition-opacity duration-300" : ""}`}>
          <Affirmation />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            {/* Timer is highlighted in focus mode */}
            <div className={isFocusMode ? "relative z-20" : ""}>
              <FocusTimer />
              {/* Show focused task under timer */}
              {focusedTask && (
                <div 
                  className="mt-4 p-4 rounded-xl border-2 shadow-lg animate-scale-in relative z-20"
                  style={{
                    backgroundColor: `${focusedTask.color}30`,
                    borderColor: focusedTask.color,
                    boxShadow: `0 0 30px ${focusedTask.color}40`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full animate-pulse"
                        style={{ backgroundColor: focusedTask.color }}
                      />
                      <span className="font-medium text-foreground">
                        {focusedTask.text}
                      </span>
                    </div>
                    <button
                      onClick={() => setFocusedTask(null)}
                      className="p-1 rounded-full hover:bg-background/50 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Focusing on this task • Click anywhere outside to exit
                  </p>
                </div>
              )}
            </div>
            <div className={isFocusMode ? "opacity-25 transition-opacity duration-300" : ""}>
              <QuickActions />
            </div>
          </div>
          
          <div className="space-y-6">
            <div className={isFocusMode ? "opacity-25 transition-opacity duration-300" : ""}>
              <TaskList />
            </div>
            <div className={isFocusMode ? "opacity-25 transition-opacity duration-300" : ""}>
              <BrainDump />
            </div>
          </div>
        </div>

        <footer className={`mt-12 text-center text-sm text-muted-foreground ${isFocusMode ? "opacity-25" : ""}`}>
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
