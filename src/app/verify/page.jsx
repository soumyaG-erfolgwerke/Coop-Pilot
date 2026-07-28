import { Suspense } from "react";
import VerifyPage from "@/pages/VerifyPage";

export const metadata = {
  title: "Verify - EasyCoop",
  description: "Verify your account",
};

export default function Verify() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyPage />
    </Suspense>
  );
}
