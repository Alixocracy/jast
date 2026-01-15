import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Archive, ArrowUp, GripVertical, Palette } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface BacklogTask {
  id: string;
  text: string;
  color: string;
}

const TASK_COLORS = [
  { name: "Sage", value: "#A8C5A8" },
  { name: "Lavender", value: "#C5A8C5" },
  { name: "Sky", value: "#A8C5D5" },
  { name: "Peach", value: "#E5C5A8" },
  { name: "Rose", value: "#E5A8B5" },
  { name: "Mint", value: "#A8E5D5" },
  { name: "Butter", value: "#E5E5A8" },
  { name: "Coral", value: "#E5B5A8" },
];

const BACKLOG_STORAGE_KEY = "focusflow-backlog";

export const getBacklogTasks = (): BacklogTask[] => {
  try {
    const stored = localStorage.getItem(BACKLOG_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load backlog from localStorage", e);
  }
  return [];
};

export const saveBacklogTasks = (tasks: BacklogTask[]) => {
  localStorage.setItem(BACKLOG_STORAGE_KEY, JSON.stringify(tasks));
};

export const addToBacklog = (task: BacklogTask) => {
  const backlog = getBacklogTasks();
  backlog.push(task);
  saveBacklogTasks(backlog);
  window.dispatchEvent(new CustomEvent("backlog-updated"));
};

interface BacklogProps {
  onMoveToToday: (task: BacklogTask) => boolean; // Returns false if today is full
}

export function Backlog({ onMoveToToday }: BacklogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [backlogTasks, setBacklogTasks] = useState<BacklogTask[]>(getBacklogTasks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);

  // Listen for backlog updates from TaskList
  useEffect(() => {
    const handleBacklogUpdate = () => {
      setBacklogTasks(getBacklogTasks());
    };
    window.addEventListener("backlog-updated", handleBacklogUpdate);
    return () => window.removeEventListener("backlog-updated", handleBacklogUpdate);
  }, []);

  // Save to localStorage when backlog changes
  useEffect(() => {
    saveBacklogTasks(backlogTasks);
  }, [backlogTasks]);

  const handleMoveToToday = (task: BacklogTask) => {
    const success = onMoveToToday(task);
    if (success) {
      setBacklogTasks(backlogTasks.filter((t) => t.id !== task.id));
    }
  };

  const updateTaskColor = (id: string, color: string) => {
    setBacklogTasks(backlogTasks.map((task) =>
      task.id === id ? { ...task, color } : task
    ));
  };

  const deleteTask = (id: string) => {
    setBacklogTasks(backlogTasks.filter((task) => task.id !== id));
  };

  const startEditing = (task: BacklogTask) => {
    setEditingId(task.id);
    setEditText(task.text);
  };

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      setBacklogTasks(backlogTasks.map((task) =>
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

    const draggedIndex = backlogTasks.findIndex((t) => t.id === draggedTaskId);
    const targetIndex = backlogTasks.findIndex((t) => t.id === targetTaskId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const newTasks = [...backlogTasks];
    const [draggedTask] = newTasks.splice(draggedIndex, 1);
    newTasks.splice(targetIndex, 0, draggedTask);

    setBacklogTasks(newTasks);
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-card rounded-2xl shadow-card animate-fade-in">
        <CollapsibleTrigger asChild>
          <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-2xl">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Backlog</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                {backlogTasks.length}
              </span>
            </div>
            {isOpen ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4">
            {backlogTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tasks in backlog. Move tasks here to save them for later.
              </p>
            ) : (
              <div className="space-y-2">
                {backlogTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable={editingId !== task.id}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragOver={(e) => handleDragOver(e, task.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, task.id)}
                    onDragEnd={handleDragEnd}
                    className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing ${
                      draggedTaskId === task.id ? "opacity-50" : ""
                    } ${dragOverTaskId === task.id ? "border-primary border-2" : ""}`}
                    style={{
                      backgroundColor: `${task.color}20`,
                      borderColor: dragOverTaskId === task.id ? undefined : `${task.color}40`,
                    }}
                  >
                    <div className="flex-shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground cursor-grab">
                      <GripVertical className="w-4 h-4" />
                    </div>

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
                          onClick={() => startEditing(task)}
                          className="text-sm text-foreground cursor-pointer hover:text-primary transition-all duration-200"
                          title="Click to edit"
                        >
                          {task.text}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleMoveToToday(task)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all duration-200 p-1 rounded-md hover:bg-primary/10"
                      title="Move to Today"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>

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
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
