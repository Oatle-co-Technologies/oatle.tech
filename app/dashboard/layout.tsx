"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import MemberOverview from "./member-overview";
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

  const [menuOpen, setMenuOpen] = useState(false);

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
        {!isUnauthorizedPage && staff?.access_level === "member" ? (
          <div className="member-dashboard">
            <button type="button" className="member-menu-toggle" aria-expanded={menuOpen} aria-controls="member-dashboard-menu" onClick={() => setMenuOpen(open => !open)}>{menuOpen ? "Close menu" : "Menu"}</button>
            <aside className={`member-dashboard-sidebar ${menuOpen ? "member-menu-open" : ""}`}>
              <Link href="/" className="dashboard-logo" aria-label="Oatle Technologies home"><Image src="/oatle-technologies-transparent-logo.png" alt="Oatle Technologies" width={164} height={112} /></Link>
              <nav id="member-dashboard-menu" className="dashboard-nav" aria-label="Dashboard menu">
                {[
                  { href: "/dashboard", label: "Overview" },
                  { href: "/dashboard/clients", label: "Clients" },
                  { href: "/dashboard/leads", label: "Leads" },
                  { href: "/dashboard/tasks", label: "Tasks" },
                  { href: "/dashboard/inbox", label: "Inbox" },
                  { href: "/dashboard/appointments", label: "Appointments" },
                  { href: "/dashboard/projects", label: "Projects" },
                  { href: "/dashboard/settings", label: "Settings" },
                ].map(item => {
                  const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
                  return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`dashboard-nav-item ${active ? "active" : ""}`} onClick={() => setMenuOpen(false)}>{item.label}</Link>;
                })}
              </nav>
            </aside>
            <div className="member-dashboard-content">{pathname === "/dashboard" ? <MemberOverview /> : children}</div>
          </div>
        ) : pathname === "/dashboard" ? children : (
          <div className="dashboard-content-centered">{children}</div>
        )}
      </div>
    );
  }

  return null;
}