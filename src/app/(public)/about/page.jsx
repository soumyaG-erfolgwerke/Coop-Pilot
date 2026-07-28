import { Suspense } from "react";
import AboutPage from "@/pages/AboutPage_v2";

export const metadata = {
  title: "About - EasyCoop",
  description: "Learn more about EasyCoop",
};

export default function About() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AboutPage />
    </Suspense>
  );
}
