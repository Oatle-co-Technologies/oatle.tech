"use client";

import { useEffect } from "react";
import "./dashboard.css";
import TaskNotifications from "@/components/dashboard/TaskNotifications";
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
  const { staff, loading, userEmail } = useAuth();

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

    router.replace(userEmail ? "/dashboard/unauthorized" : "/login");
  }, [isUnauthorizedPage, loading, router, staff, userEmail]);

  if (
    isUnauthorizedPage ||
    (!loading &&
      staff &&
      allowedAccessLevels.has(staff.access_level))
  ) {
    return (
      <div className="dashboard-workspace">
        {!isUnauthorizedPage && pathname !== "/dashboard/settings" && (
          <TaskNotifications key={staff?.id ?? "signed-out"} showControls={false} />
        )}
        {pathname === "/dashboard" ? children : (
          <div className="dashboard-content-centered">{children}</div>
        )}
      </div>
    );
  }

  return null;
}