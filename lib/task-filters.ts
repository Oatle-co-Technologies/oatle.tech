export type TaskFilter = "all" | "completed" | "outstanding" | "overdue" | "blocked";
export function taskMatchesFilter(task: { status: string; due_date: string | null }, filter: TaskFilter, today: string): boolean {
  switch (filter) {
    case "completed": return task.status === "completed";
    case "outstanding": return task.status !== "completed";
    case "overdue": return task.status !== "completed" && Boolean(task.due_date && task.due_date < today);
    case "blocked": return task.status === "blocked";
    default: return true;
  }
}
export function parseTaskFilter(value: string | string[] | undefined): TaskFilter {
  return value === "completed" || value === "outstanding" || value === "overdue" || value === "blocked" ? value : "all";
}
