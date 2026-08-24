import Link from "next/link";

export default function BackToDashboard() {
  return (
    <Link
      href="/dashboard"
      className="dashboard-link"
      style={{
        display: "inline-block",
        marginBottom: "24px",
      }}
    >
      ← Back to Dashboard
    </Link>
  );
}