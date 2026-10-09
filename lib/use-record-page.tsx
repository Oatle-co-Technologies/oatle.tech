"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type RecordAction = "new" | "edit" | "email" | "view";
export function useRecordPage<T extends { id: number }>({ base, records, loading, ready = true, onNew, onEdit, onEmail, onReset }: {
  base: string; records: T[]; loading: boolean; ready?: boolean;
  onNew: () => void; onEdit: (record: T) => void; onEmail?: (record: T) => void; onReset?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const parts = pathname.startsWith(`${base}/`) ? pathname.slice(base.length + 1).split("/") : [];
  const action = (parts[0] === "new" ? "new" : parts[1]) as RecordAction | undefined;
  const id = parts[0] === "new" ? null : Number(parts[0]);
  const isDetail = parts.length > 0;
  const record = records.find(item => item.id === id);
  const initialized = useRef("");
  const callbacks = useRef({ onNew, onEdit, onEmail, onReset });
  useEffect(() => { callbacks.current = { onNew, onEdit, onEmail, onReset }; });
  useEffect(() => {
    if (!isDetail || initialized.current === pathname || !ready) return;
    if (action !== "new" && !record) return;
    initialized.current = pathname;
    callbacks.current.onReset?.();
    if (action === "new") callbacks.current.onNew();
    if (action === "edit" && record) callbacks.current.onEdit(record);
    if (action === "email" && record) callbacks.current.onEmail?.(record);
  }, [action, isDetail, pathname, ready, record]);
  function open(action: RecordAction, id?: number) {
    router.push(action === "new" ? `${base}/new` : `${base}/${id}/${action}`);
  }
  return { isDetail, action, id, open, back: () => router.push(base),
    showList: !isDetail || action === "email" || action === "view",
    header: isDetail ? <div className="dashboard-record-header">
      <Link className="dashboard-link" href={base}>← Back to {base.split("/").at(-1)}</Link>
      {action !== "new" && !record && <p role="status">{loading ? "Loading record…" : "This record could not be loaded. Return to the list and try again."}</p>}
    </div> : null,
  };
}
