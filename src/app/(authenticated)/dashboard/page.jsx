import { Suspense } from "react";
import Dashboard from "@/pages/Dashboard";

export const metadata = {
  title: "Dashboard - EasyCoop",
  description: "Your EasyCoop dashboard",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-zinc-500">Loading dashboard...</div>}>
      <Dashboard />
    </Suspense>
  );
}

