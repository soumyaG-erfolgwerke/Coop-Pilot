import { Suspense } from "react";
import AdminPage from "@/pages/AdminPage";

export const metadata = {
  title: "Admin Dashboard - EasyCoop",
  description: "Cooperative admin dashboard",
};

export default function Admin() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-zinc-500">Loading admin dashboard...</div>}>
      <AdminPage />
    </Suspense>
  );
}

