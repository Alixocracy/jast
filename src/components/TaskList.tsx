import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Check, Sparkles, Palette, Target, GripVertical } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePointsContext } from "@/contexts/PointsContext";
import { useFocusMode } from "@/contexts/FocusModeContext";
import { toast } from "sonner";
import { addToBacklog } from "@/components/Backlog";

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  color: string;
}

export const TASK_COLORS = [
  { name: "Sage", value: "#A8C5A8" },
  { name: "Lavender", value: "#C5A8C5" },
  { name: "Sky", value: "#A8C5D5" },
  { name: "Peach", value: "#E5C5A8" },
  { name: "Rose", value: "#E5A8B5" },
  { name: "Mint", value: "#A8E5D5" },
  { name: "Butter", value: "#E5E5A8" },
  { name: "Coral", value: "#E5B5A8" },
];

const STORAGE_KEY = "focusflow-tasks";
const FOCUS_HINT_KEY = "focusflow-focus-hint-seen-v2";
export const MAX_TODAY_TASKS = 10;

const getStoredTasks = (): Task[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load tasks from localStorage", e);
  }
  return [
    { id: "1", text: "Take a 5-minute break", completed: false, color: TASK_COLORS[0].value },
    { id: "2", text: "Drink a glass of water", completed: true, color: TASK_COLORS[2].value },
    { id: "3", text: "Review today's priorities", completed: false, color: TASK_COLORS[4].value },
    { id: "4", text: "Set one clear focus for this session", completed: false, color: TASK_COLORS[6].value },
    { id: "5", text: "Tidy your desk for 2 minutes", completed: false, color: TASK_COLORS[5].value },
  ];
};

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>(getStoredTasks);
  const [newTask, setNewTask] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedColor, setSelectedColor] = useState(TASK_COLORS[0].value);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showFocusHint, setShowFocusHint] = useState(false);
  const [focusHintTaskId, setFocusHintTaskId] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [isDragOverContainer, setIsDragOverContainer] = useState(false);
  const { addPoints } = usePointsContext();
  const { setFocusedTask, focusedTask } = useFocusMode();

  const handleFocusTask = (task: Task) => {
    if (task.completed) return;
    setFocusedTask({
      id: task.id,
      text: task.text,
      color: task.color,
    });
    if (showFocusHint) {
      localStorage.setItem(FOCUS_HINT_KEY, "true");
      setShowFocusHint(false);
    }
    toast.success("Focus mode activated! 🎯");
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  // Listen for move-to-backlog events from Backlog component
  useEffect(() => {
    const handleMoveToBacklog = (e: CustomEvent<string>) => {
      const task = tasks.find(t => t.id === e.detail);
      if (task && !task.completed) {
        addToBacklog({
          id: task.id,
          text: task.text,
          color: task.color,
        });
        setTasks(prev => prev.filter((t) => t.id !== task.id));
        toast.success("Task moved to backlog");
      }
    };
    window.addEventListener("move-to-backlog", handleMoveToBacklog as EventListener);
    return () => window.removeEventListener("move-to-backlog", handleMoveToBacklog as EventListener);
  }, [tasks]);

  // On first visit, highlight the first incomplete task's focus icon
  useEffect(() => {
    const hasSeenHint = localStorage.getItem(FOCUS_HINT_KEY) === "true";
    if (hasSeenHint) return;

    // If hint already active, ensure it stays targeted to the first available task
    if (showFocusHint) {
      const currentTarget = tasks.find((t) => !t.completed && t.id === focusHintTaskId);
      if (!currentTarget) {
        const next = tasks.find((t) => !t.completed);
        setFocusHintTaskId(next ? next.id : null);
      }
      return;
    }

    const firstIncomplete = tasks.find((t) => !t.completed);
    if (firstIncomplete) {
      setFocusHintTaskId(firstIncomplete.id);
      setShowFocusHint(true);
    }
  }, [focusHintTaskId, showFocusHint, tasks]);

  const addTask = () => {
    if (newTask.trim()) {
      const incompleteTasks = tasks.filter(t => !t.completed);
      if (incompleteTasks.length >= MAX_TODAY_TASKS) {
        // Move to backlog instead
        addToBacklog({
          id: Date.now().toString(),
          text: newTask.trim(),
          color: selectedColor,
        });
        toast.info("Today's list is full. Task added to backlog.");
        setNewTask("");
        setIsAdding(false);
        return;
      }
      setTasks([
        ...tasks,
        {
          id: Date.now().toString(),
          text: newTask.trim(),
          completed: false,
          color: selectedColor,
        },
      ]);
      setNewTask("");
      setIsAdding(false);
    }
  };

  const moveToBacklog = (task: Task) => {
    addToBacklog({
      id: task.id,
      text: task.text,
      color: task.color,
    });
    setTasks(tasks.filter((t) => t.id !== task.id));
    toast.success("Task moved to backlog");
  };

  const addTaskFromBacklog = (backlogTask: { id: string; text: string; color: string }): boolean => {
    const incompleteTasks = tasks.filter(t => !t.completed);
    if (incompleteTasks.length >= MAX_TODAY_TASKS) {
      toast.error("Today's list is full (max 10 tasks). Complete some tasks first.");
      return false;
    }
    setTasks([
      ...tasks,
      {
        id: backlogTask.id,
        text: backlogTask.text,
        completed: false,
        color: backlogTask.color,
      },
    ]);
    toast.success("Task moved to Today");
    return true;
  };

  const updateTaskColor = (id: string, color: string) => {
    setTasks(tasks.map((task) =>
      task.id === id ? { ...task, color } : task
    ));
  };

  const toggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task && !task.completed) {
      addPoints("Completed task", 2);
      toast.success("+2 points for completing a task! ⭐");
    }
    setTasks(
      tasks.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditText(task.text);
  };

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      setTasks(tasks.map((task) =>
        task.id === editingId ? { ...task, text: editText.trim() } : task
      ));
    }
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.setData("source", "today");
  };

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    if (draggedTaskId && draggedTaskId !== taskId) {
      setDragOverTaskId(taskId);
    }
  };

  const handleDragLeave = () => {
    setDragOverTaskId(null);
  };

  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetTaskId) return;

    const draggedIndex = tasks.findIndex((t) => t.id === draggedTaskId);
    const targetIndex = tasks.findIndex((t) => t.id === targetTaskId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newTasks = [...tasks];
    const [draggedTask] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, draggedTask);

    setTasks(newTasks);
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setIsDragOverContainer(false);
  };

  // Handle drops from backlog onto the task list container
  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const source = e.dataTransfer.types.includes("source") ? "external" : null;
    if (!draggedTaskId) {
      setIsDragOverContainer(true);
    }
  };

  const handleContainerDragLeave = (e: React.DragEvent) => {
    // Only set false if we're leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOverContainer(false);
    }
  };

  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverContainer(false);
    
    // Check if this is a drop from backlog
    const taskDataStr = e.dataTransfer.getData("taskData");
    if (taskDataStr) {
      try {
        const taskData = JSON.parse(taskDataStr);
        const success = addTaskFromBacklog(taskData);
        if (success) {
          // Remove from backlog
          window.dispatchEvent(new CustomEvent("remove-from-backlog", { detail: taskData.id }));
        }
      } catch (err) {
        console.error("Failed to parse task data", err);
      }
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const incompleteTasks = tasks.filter((t) => !t.completed);

  // Expose addTaskFromBacklog function
  useEffect(() => {
    (window as any).addTaskFromBacklog = addTaskFromBacklog;
    return () => {
      delete (window as any).addTaskFromBacklog;
    };
  }, [tasks]);

  return (
    <div 
      className={`bg-card rounded-2xl p-6 shadow-card animate-fade-in animate-delay-200 transition-all duration-200 ${
        isDragOverContainer ? "ring-2 ring-primary ring-offset-2" : ""
      }`}
      onDragOver={handleContainerDragOver}
      onDragLeave={handleContainerDragLeave}
      onDrop={handleContainerDrop}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">Today's Tasks</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
            {incompleteTasks.length}/{MAX_TODAY_TASKS}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {completedCount}/{tasks.length} done
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${tasks.length ? (completedCount / tasks.length) * 100 : 0}%` }}
        />
      </div>

      {/* Task list */}
      <div className="space-y-2 mb-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            draggable={editingId !== task.id}
            onDragStart={(e) => handleDragStart(e, task.id)}
            onDragOver={(e) => handleDragOver(e, task.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, task.id)}
            onDragEnd={handleDragEnd}
            className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing ${
              focusedTask?.id === task.id ? "ring-2 ring-primary ring-offset-2" : ""
            } ${draggedTaskId === task.id ? "opacity-50" : ""} ${
              dragOverTaskId === task.id ? "border-primary border-2" : ""
            }`}
            style={{
              backgroundColor: task.completed ? undefined : `${task.color}20`,
              borderColor: dragOverTaskId === task.id ? undefined : (task.completed ? undefined : `${task.color}40`),
            }}
          >
            <div className="flex-shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground cursor-grab">
              <GripVertical className="w-4 h-4" />
            </div>
            <button
              onClick={() => toggleTask(task.id)}
              className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                task.completed
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/40 hover:border-primary"
              }`}
            >
              {task.completed && <Check className="w-4 h-4" />}
            </button>
            
            <div className="flex-1 flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: task.color }}
              />
              {editingId === task.id ? (
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  onBlur={saveEdit}
                  className="flex-1 px-2 py-1 rounded bg-background border border-primary/50 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
              ) : (
                <span
                  onClick={() => !task.completed && startEditing(task)}
                  className={`text-sm transition-all duration-200 ${
                    task.completed
                      ? "text-muted-foreground line-through"
                      : "text-foreground cursor-pointer hover:text-primary"
                  }`}
                  title={task.completed ? undefined : "Click to edit"}
                >
                  {task.text}
                </span>
              )}
            </div>

            {/* Focus button - only for incomplete tasks */}
            {!task.completed && (
              <button
                onClick={() => handleFocusTask(task)}
                className={`transition-all duration-200 p-1 rounded-md ${
                  focusedTask?.id === task.id 
                    ? "opacity-100 text-primary" 
                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                } ${
                  showFocusHint && focusHintTaskId === task.id
                    ? "opacity-100 ring-2 ring-primary/60 bg-primary/10 animate-pulse"
                    : "opacity-0 group-hover:opacity-100"
                }`}
                style={
                  showFocusHint && focusHintTaskId === task.id
                    ? { animationDuration: "1.8s" }
                    : undefined
                }
                title="Focus on this task"
              >
                <Target className="w-4 h-4" />
              </button>
            )}


            <Popover>
              <PopoverTrigger asChild>
                <button className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all duration-200">
                  <Palette className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="end">
                <div className="grid grid-cols-4 gap-1">
                  {TASK_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => updateTaskColor(task.id, color.value)}
                      className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                      style={{
                        backgroundColor: color.value,
                        borderColor: task.color === color.value ? "hsl(var(--foreground))" : "transparent",
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <button
              onClick={() => deleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all duration-200 text-xs"
            >
              remove
            </button>
          </div>
        ))}
      </div>

      {/* Add task */}
      {isAdding ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="What needs to be done?"
              className="flex-1 px-4 py-2 rounded-xl bg-muted border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            <Button onClick={addTask} size="sm">
              Add
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Color:</span>
            {TASK_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                className="w-5 h-5 rounded-full border-2 transition-all hover:scale-110"
                style={{
                  backgroundColor: color.value,
                  borderColor: selectedColor === color.value ? "hsl(var(--foreground))" : "transparent",
                }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      ) : (
        <Button
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add a task
        </Button>
      )}

      {completedCount === tasks.length && tasks.length > 0 && (
        <div className="mt-4 p-3 rounded-xl gradient-calm flex items-center gap-2 text-sm text-calm-foreground">
          <Sparkles className="w-4 h-4" />
          Amazing! You've completed all your tasks! 🎉
        </div>
      )}
    </div>
  );
}
