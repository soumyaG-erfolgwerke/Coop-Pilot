import { Suspense } from "react";
import MemberPage from "@/pages/MemberPage";

export const metadata = {
  title: "Member Dashboard - EasyCoop",
  description: "Member dashboard",
};

export default function Member() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-zinc-500">Loading member dashboard...</div>}>
      <MemberPage />
    </Suspense>
  );
}

