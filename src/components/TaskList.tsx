import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Check, Sparkles, Palette } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Task {
  id: string;
  text: string;
  completed: boolean;
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

const STORAGE_KEY = "focusflow-tasks";

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
  ];
};

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>(getStoredTasks);
  const [newTask, setNewTask] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedColor, setSelectedColor] = useState(TASK_COLORS[0].value);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (newTask.trim()) {
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

  const updateTaskColor = (id: string, color: string) => {
    setTasks(tasks.map((task) =>
      task.id === id ? { ...task, color } : task
    ));
  };

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="bg-card rounded-2xl p-6 shadow-card animate-fade-in animate-delay-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Today's Tasks</h2>
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
            className="group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200"
            style={{
              backgroundColor: task.completed ? undefined : `${task.color}20`,
              borderColor: task.completed ? undefined : `${task.color}40`,
            }}
          >
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
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: task.color }}
              />
              <span
                className={`text-sm transition-all duration-200 ${
                  task.completed
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                }`}
              >
                {task.text}
              </span>
            </div>

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
