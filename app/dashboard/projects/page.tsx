import Projects from "./projects";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ client_id?: string }> }) {
  const { client_id } = await searchParams;
  const clientId = client_id && /^\d+$/.test(client_id) ? Number(client_id) : undefined;
  return <Projects clientId={clientId} />;
}
