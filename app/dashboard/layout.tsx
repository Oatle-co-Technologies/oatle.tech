"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-context";

const allowedAccessLevels = new Set(["admin", "member"]);

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const router = useRouter();
  const { staff, loading } = useAuth();

  const isUnauthorizedPage =
    pathname === "/dashboard/unauthorized";

  useEffect(() => {
    if (
      loading ||
      isUnauthorizedPage ||
      (staff && allowedAccessLevels.has(staff.access_level))
    ) {
      return;
    }

    router.replace("/dashboard/unauthorized");
  }, [isUnauthorizedPage, loading, router, staff]);

  if (
    isUnauthorizedPage ||
    (!loading &&
      staff &&
      allowedAccessLevels.has(staff.access_level))
  ) {
    return children;
  }

  return null;
}