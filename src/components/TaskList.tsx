import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Check, Circle, Sparkles } from "lucide-react";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
}

const priorityColors = {
  low: "bg-calm border-calm-foreground/20",
  medium: "bg-accent border-accent-foreground/20",
  high: "bg-gentle border-gentle-foreground/20",
};

const priorityDots = {
  low: "bg-calm-foreground/60",
  medium: "bg-energy",
  high: "bg-destructive",
};

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", text: "Take a 5-minute break", completed: false, priority: "medium" },
    { id: "2", text: "Drink a glass of water", completed: true, priority: "low" },
    { id: "3", text: "Review today's priorities", completed: false, priority: "high" },
  ]);
  const [newTask, setNewTask] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const addTask = () => {
    if (newTask.trim()) {
      setTasks([
        ...tasks,
        {
          id: Date.now().toString(),
          text: newTask.trim(),
          completed: false,
          priority: "medium",
        },
      ]);
      setNewTask("");
      setIsAdding(false);
    }
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
            className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${
              task.completed
                ? "bg-muted/50 border-border"
                : priorityColors[task.priority]
            }`}
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
              <div className={`w-2 h-2 rounded-full ${priorityDots[task.priority]}`} />
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
