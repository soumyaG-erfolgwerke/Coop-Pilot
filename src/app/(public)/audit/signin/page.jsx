import AuditSignInPage from "@/pages/AuditSignInPage";
import { Suspense } from "react";


export const metadata = {
  title: "Audit Sign In - EasyCoop",
  description: "Sign in as an auditor or organization admin",
};

export default function AuditSignIn() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuditSignInPage />
    </Suspense>
  );
}
