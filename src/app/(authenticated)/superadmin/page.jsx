import { Suspense } from "react";
import SuperAdminPage from "@/pages/SuperAdminPage";

export const metadata = {
  title: "Super Admin Dashboard - EasyCoop",
  description: "Super admin dashboard",
};

export default function SuperAdmin() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-zinc-500">Loading super admin dashboard...</div>}>
      <SuperAdminPage />
    </Suspense>
  );
}

