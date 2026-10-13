import Tasks from "./tasks";
import { parseTaskFilter } from "@/lib/task-filters";

export default async function TasksPage({ searchParams }: {
  searchParams: Promise<{ view?: string | string[]; filter?: string | string[] }>;
}) {
  const { view, filter } = await searchParams;
  const initialView = view === "schedule" ? "schedule" : view === "management" ? "management" : "overview";
  const initialFilter = parseTaskFilter(filter);
  return <Tasks key={`${initialView}-${initialFilter}`} initialView={initialView} initialFilter={initialFilter} />;
}
