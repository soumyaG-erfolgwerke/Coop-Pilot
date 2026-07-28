import { Suspense } from "react";
import SignInPage from "@/pages/SignInPage";

export const metadata = {
  title: "Sign In - EasyCoop",
  description: "Sign in to your EasyCoop account",
};

export default function SignIn() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInPage />
    </Suspense>
  );
}
