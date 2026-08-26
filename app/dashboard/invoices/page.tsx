"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-context";
import Invoices from "./invoices";

export default function InvoicesPage() {
  const router = useRouter();
  const { staff, loading } = useAuth();

  useEffect(() => {
    if (!loading && staff?.access_level !== "admin") {
      router.push("/dashboard/unauthorized");
    }
  }, [loading, staff, router]);

  if (loading || !staff) {
    return null;
  }

  if (staff.access_level !== "admin") {
    return null;
  }

  return <Invoices />;
}