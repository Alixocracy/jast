import { Header } from "@/components/Header";
import { Affirmation } from "@/components/Affirmation";
import { FocusTimer } from "@/components/FocusTimer";
import { TaskList } from "@/components/TaskList";
import { BrainDump } from "@/components/BrainDump";
import { QuickActions } from "@/components/QuickActions";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Header />
        
        <div className="mb-6">
          <Affirmation />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <FocusTimer />
            <QuickActions />
          </div>
          
          <div className="space-y-6">
            <TaskList />
            <BrainDump />
          </div>
        </div>

        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Remember: your brain is unique, not broken. 💚</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
