import { notFound } from "next/navigation";
import MailScreen from "../mail-screen";
import { mailRoute } from "../mail-route";

export default async function Page({ params, searchParams }: {
  params: Promise<{ uid: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { uid } = await params;
  if (!/^\d+$/.test(uid) || !Number.isSafeInteger(Number(uid)) || Number(uid) < 1) notFound();
  const query = mailRoute(await searchParams);
  return <MailScreen initialView={query.view} initialBefore={query.before} messageUid={Number(uid)} validity={query.validity ?? undefined} />;
}
