import MailScreen from "./mail-screen";
import { mailRoute } from "./mail-route";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = mailRoute(await searchParams);
  return <MailScreen initialView={query.view} initialBefore={query.before} initialSearch={query.search} />;
}
