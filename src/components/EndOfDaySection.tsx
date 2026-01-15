import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Moon, Mail, RefreshCw, Check, Loader2, Clipboard, FileText, ChevronDown, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserName } from "@/contexts/UserNameContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getBacklogTasks } from "@/components/Backlog";
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
  const [isCopyingMarkdown, setIsCopyingMarkdown] = useState(false);
  const [markdownCopied, setMarkdownCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { userName } = useUserName();

  const getTodayData = () => {
    const tasks: Task[] = JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
    const thoughts: Thought[] = JSON.parse(localStorage.getItem(BRAINDUMP_KEY) || "[]");
    const pointsData = JSON.parse(localStorage.getItem(POINTS_KEY) || '{"total":0,"history":[]}');
    const points = typeof pointsData === 'object' ? pointsData.total : 0;
    const pointsHistory = typeof pointsData === 'object' ? (pointsData.history || []) : [];

    return { tasks, thoughts, points, pointsHistory };
  };

  const buildMarkdownSummary = () => {
    const { tasks, thoughts, points, pointsHistory } = getTodayData();
    const completedTasks = tasks.filter(t => t.completed);
    const pendingTasks = tasks.filter(t => !t.completed);
    const dateStr = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const LEVELS = [
      { min: 0, name: "Seedling", emoji: "🌱" },
      { min: 50, name: "Rising Star", emoji: "⭐" },
      { min: 100, name: "Achiever", emoji: "⚡" },
      { min: 200, name: "Champion", emoji: "🔥" },
      { min: 500, name: "Master", emoji: "👑" },
    ];

    const getLevelInfo = (pts: number) => {
      for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (pts >= LEVELS[i].min) {
          const nextLevel = LEVELS[i + 1];
          return { 
            ...LEVELS[i],
            nextLevel: nextLevel?.name,
            pointsToNext: nextLevel ? nextLevel.min - pts : 0,
          };
        }
      }
      return { ...LEVELS[0], nextLevel: LEVELS[1]?.name, pointsToNext: LEVELS[1]?.min || 0, emoji: "🌱", name: "Seedling" };
    };

    const levelInfo = getLevelInfo(points);
    
    const taskPoints = pointsHistory.filter(h => h.action.includes('task')).reduce((sum, h) => sum + h.points, 0);
    const wellnessPoints = pointsHistory.filter(h => ['Drink Water', 'Deep Breath', 'Take a Walk', 'Mindful Break'].includes(h.action)).reduce((sum, h) => sum + h.points, 0);
    const focusPoints = pointsHistory.filter(h => h.action.includes('Focus')).reduce((sum, h) => sum + h.points, 0);
    const otherPoints = pointsHistory.filter(h => !h.action.includes('task') && !['Drink Water', 'Deep Breath', 'Take a Walk', 'Mindful Break'].includes(h.action) && !h.action.includes('Focus')).reduce((sum, h) => sum + h.points, 0);

    const lines: string[] = [
      `# Daily Summary - ${dateStr}`,
      "",
      `Hey ${userName || "Friend"} 👋`,
      "",
      "## Points",
      `- Level: ${levelInfo.name} ${levelInfo.emoji}`,
      `- Total: ${points}`,
      levelInfo.nextLevel 
        ? `- ${levelInfo.pointsToNext} points to reach ${levelInfo.nextLevel}`
        : "- Max level reached 🎉",
      "",
      "### Breakdown",
      `- Tasks: ${taskPoints}`,
      `- Wellness: ${wellnessPoints}`,
      `- Focus: ${focusPoints}`,
      `- Other: ${otherPoints}`,
      "",
      `## Completed Tasks (${completedTasks.length})`,
    ];

    if (completedTasks.length) {
      completedTasks.forEach(task => lines.push(`- [x] ${task.text}`));
    } else {
      lines.push("- None yet - tomorrow is a new day!");
    }

    lines.push("", `## Pending Tasks (${pendingTasks.length})`);

    if (pendingTasks.length) {
      pendingTasks.forEach(task => lines.push(`- [ ] ${task.text}`));
    } else {
      lines.push("- Nothing pending - nice work!");
    }

    lines.push("", `## Brain Dump (${thoughts.length})`);

    if (thoughts.length) {
      thoughts.forEach(thought => lines.push(`- ${thought.text}`));
    } else {
      lines.push("- No notes captured.");
    }

    lines.push("", "Keep going - your brain is unique, not broken. 💚");

    return lines.join("\n");
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
    
    const { tasks, thoughts, points, pointsHistory } = getTodayData();
    const backlogTasks = getBacklogTasks();
    
    try {
      const { data, error } = await supabase.functions.invoke('send-daily-summary', {
        body: {
          email,
          userName: userName || 'Friend',
          tasks,
          thoughts,
          points,
          pointsHistory,
          backlogTasks,
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

  const handleCopyMarkdown = async () => {
    setIsCopyingMarkdown(true);
    try {
      const markdown = buildMarkdownSummary();
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(markdown);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = markdown;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setMarkdownCopied(true);
      toast.success("Markdown summary copied! 📝");
      setTimeout(() => setMarkdownCopied(false), 2000);
    } catch (error: any) {
      console.error("Error copying markdown:", error);
      toast.error(error.message || "Unable to copy markdown. Please try again.");
    } finally {
      setIsCopyingMarkdown(false);
    }
  };

  const handleDownloadMarkdown = () => {
    try {
      const markdown = buildMarkdownSummary();
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const dateSlug = new Date().toISOString().split("T")[0];
      const link = document.createElement("a");
      link.href = url;
      link.download = `jast-daily-summary-${dateSlug}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Markdown summary downloaded");
    } catch (error: any) {
      console.error("Error downloading markdown:", error);
      toast.error(error.message || "Unable to download markdown. Please try again.");
    }
  };

  const [keepUndoneTasks, setKeepUndoneTasks] = useState(true);

  const handleReset = () => {
    // Get current tasks
    const tasks: Task[] = JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
    
    if (keepUndoneTasks) {
      // Keep only uncompleted tasks
      const undoneTasks = tasks.filter(t => !t.completed);
      localStorage.setItem(TASKS_KEY, JSON.stringify(undoneTasks));
    } else {
      // Clear all tasks
      localStorage.setItem(TASKS_KEY, JSON.stringify([]));
    }
    
    // Clear brain dump
    localStorage.setItem(BRAINDUMP_KEY, JSON.stringify([]));
    // Reset points with proper structure
    localStorage.setItem(POINTS_KEY, JSON.stringify({ total: 0, history: [] }));
    
    toast.success(keepUndoneTasks 
      ? "Fresh start! Undone tasks carried over 🌅" 
      : "Fresh start! Ready for tomorrow 🌅"
    );
    
    // Reload the page to reflect changes
    window.location.reload();
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="bg-card rounded-2xl p-6 shadow-card animate-fade-in"
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">End of Day</h2>
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1">
            {isOpen ? "Hide" : "Show"}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </Button>
        </CollapsibleTrigger>
      </div>

      <CollapsibleContent>
        <p className="text-sm text-muted-foreground mb-4">
          Ready to wrap up? Get a brief summary of today sent to your email, or grab a .md format copy for your notes.
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

          {/* Markdown summary section */}
          <div className="p-4 rounded-xl bg-muted/50 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="w-4 h-4" />
              <span>Copy .md summary</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Generates a markdown recap with your points, tasks, and brain dump notes.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="secondary"
                onClick={handleCopyMarkdown}
                disabled={isCopyingMarkdown}
                size="sm"
                className="gap-2"
              >
                {isCopyingMarkdown ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : markdownCopied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Clipboard className="w-4 h-4" />
                )}
                {markdownCopied ? "Copied" : "Copy .md"}
              </Button>
              <Button 
                variant="outline"
                onClick={handleDownloadMarkdown}
                size="sm"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Download .md
              </Button>
            </div>
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
                  This will clear brain dump entries and reset your points to 0. 
                  Make sure you've saved your summary if you want to keep a record!
                </AlertDialogDescription>
              </AlertDialogHeader>
              
              <div className="flex items-center space-x-2 py-2">
                <Checkbox 
                  id="keep-undone" 
                  checked={keepUndoneTasks}
                  onCheckedChange={(checked) => setKeepUndoneTasks(checked === true)}
                />
                <label 
                  htmlFor="keep-undone" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Keep undone tasks for tomorrow
                </label>
              </div>
              
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset}>
                  Yes, reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
