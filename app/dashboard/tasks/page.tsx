import Tasks from "./tasks";

export default async function TasksPage({ searchParams }: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const { view } = await searchParams;
  const initialView = view === "schedule" ? "schedule" : view === "management" ? "management" : "overview";
  return <Tasks key={initialView} initialView={initialView} />;
}
