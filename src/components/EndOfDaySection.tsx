import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Moon, Mail, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const TASKS_KEY = "focusflow-tasks";
const BRAINDUMP_KEY = "focusflow-braindump";
const POINTS_KEY = "focusflow-points";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  color: string;
}

interface Thought {
  id: string;
  text: string;
  timestamp: string;
}

export function EndOfDaySection() {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const getTodaySummary = () => {
    const tasks: Task[] = JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
    const thoughts: Thought[] = JSON.parse(localStorage.getItem(BRAINDUMP_KEY) || "[]");
    const points = localStorage.getItem(POINTS_KEY) || "0";

    const completedTasks = tasks.filter(t => t.completed);
    const pendingTasks = tasks.filter(t => !t.completed);

    let summary = `📊 Your Day with JAST - ${new Date().toLocaleDateString()}\n\n`;
    summary += `⭐ Points earned: ${points}\n\n`;
    
    summary += `✅ Completed Tasks (${completedTasks.length}):\n`;
    if (completedTasks.length > 0) {
      completedTasks.forEach(t => {
        summary += `  • ${t.text}\n`;
      });
    } else {
      summary += "  No tasks completed today\n";
    }
    
    summary += `\n📋 Pending Tasks (${pendingTasks.length}):\n`;
    if (pendingTasks.length > 0) {
      pendingTasks.forEach(t => {
        summary += `  • ${t.text}\n`;
      });
    } else {
      summary += "  All caught up!\n";
    }

    summary += `\n💭 Brain Dump Entries (${thoughts.length}):\n`;
    if (thoughts.length > 0) {
      thoughts.forEach(t => {
        summary += `  • ${t.text}\n`;
      });
    } else {
      summary += "  Mind was clear today\n";
    }

    summary += "\n---\nHave a restful night! See you tomorrow 🌙";

    return summary;
  };

  const handleSendEmail = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSending(true);
    
    // Simulate sending email (in a real app, this would call a backend)
    // For now, we'll copy to clipboard and show the summary
    const summary = getTodaySummary();
    
    try {
      await navigator.clipboard.writeText(summary);
      toast.success("Summary copied to clipboard! You can paste it in an email.");
      setEmailSent(true);
    } catch {
      // Fallback: show in alert
      toast.info("Your daily summary is ready!");
      console.log(summary);
    }
    
    setIsSending(false);
  };

  const handleReset = () => {
    // Clear tasks (but keep the structure)
    localStorage.setItem(TASKS_KEY, JSON.stringify([]));
    // Clear brain dump
    localStorage.setItem(BRAINDUMP_KEY, JSON.stringify([]));
    // Reset points
    localStorage.setItem(POINTS_KEY, "0");
    
    toast.success("Fresh start! Ready for tomorrow 🌅");
    
    // Reload the page to reflect changes
    window.location.reload();
  };

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Moon className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">End of Day</h2>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Ready to wrap up? Get a summary of today and start fresh tomorrow.
      </p>

      <div className="space-y-4">
        {/* Email summary section */}
        <div className="p-4 rounded-xl bg-muted/50 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="w-4 h-4" />
            <span>Get today's summary</span>
          </div>
          
          <div className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1"
              disabled={emailSent}
            />
            <Button 
              onClick={handleSendEmail} 
              disabled={isSending || emailSent}
              size="sm"
            >
              {emailSent ? <Check className="w-4 h-4" /> : "Send"}
            </Button>
          </div>
          
          {emailSent && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Summary copied! Paste it anywhere to save.
            </p>
          )}
        </div>

        {/* Reset section */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="w-full gap-2">
              <RefreshCw className="w-4 h-4" />
              Reset for Tomorrow
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Start fresh tomorrow?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all tasks, brain dump entries, and reset your points to 0. 
                Make sure you've saved your summary if you want to keep a record!
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>
                Yes, reset everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
