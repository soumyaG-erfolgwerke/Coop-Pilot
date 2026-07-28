import { Suspense } from "react";
import SubAuditorPage from "@/pages/SubAuditorPage";

export const metadata = {
  title: "Sub Auditor - EasyCoop",
  description: "Sub auditor dashboard",
};

export default function SubAuditor() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-zinc-500">Loading auditor dashboard...</div>}>
      <SubAuditorPage />
    </Suspense>
  );
}

