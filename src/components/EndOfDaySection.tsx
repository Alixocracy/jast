import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Moon, Mail, RefreshCw, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserName } from "./OnboardingModal";
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
  const { userName } = useUserName();

  const getTodayData = () => {
    const tasks: Task[] = JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
    const thoughts: Thought[] = JSON.parse(localStorage.getItem(BRAINDUMP_KEY) || "[]");
    const pointsData = JSON.parse(localStorage.getItem(POINTS_KEY) || '{"total":0,"history":[]}');
    const points = typeof pointsData === 'object' ? pointsData.total : 0;

    return { tasks, thoughts, points };
  };

  const handleSendEmail = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSending(true);
    
    const { tasks, thoughts, points } = getTodayData();
    
    try {
      const { data, error } = await supabase.functions.invoke('send-daily-summary', {
        body: {
          email,
          userName: userName || 'Friend',
          tasks,
          thoughts,
          points,
        },
      });

      if (error) {
        throw error;
      }

      toast.success("Summary sent to your email! 📧");
      setEmailSent(true);
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast.error(error.message || "Failed to send email. Please try again.");
    }
    
    setIsSending(false);
  };

  const handleReset = () => {
    // Clear tasks (but keep the structure)
    localStorage.setItem(TASKS_KEY, JSON.stringify([]));
    // Clear brain dump
    localStorage.setItem(BRAINDUMP_KEY, JSON.stringify([]));
    // Reset points with proper structure
    localStorage.setItem(POINTS_KEY, JSON.stringify({ total: 0, history: [] }));
    
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
        Ready to wrap up? Get a beautiful summary of today sent to your email.
      </p>

      <div className="space-y-4">
        {/* Email summary section */}
        <div className="p-4 rounded-xl bg-muted/50 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Mail className="w-4 h-4" />
            <span>Email today's summary</span>
          </div>
          
          <div className="flex gap-2">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1"
              disabled={emailSent || isSending}
            />
            <Button 
              onClick={handleSendEmail} 
              disabled={isSending || emailSent}
              size="sm"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : emailSent ? (
                <Check className="w-4 h-4" />
              ) : (
                "Send"
              )}
            </Button>
          </div>
          
          {emailSent && (
            <p className="text-xs text-green-600 dark:text-green-400">
              ✓ Summary sent! Check your inbox.
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
