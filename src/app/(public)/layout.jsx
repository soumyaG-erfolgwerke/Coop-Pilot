"use client";

import Navbar from "@/components/shared/Navbar_v2";
import { Navbar as Navbar2 } from "@/components/Navbar";
import Footer from "@/components/shared/Footer_v2";
import { useAuth } from "@/hooks/useAuth";

export default function PublicLayout({ children }) {
  const { user } = useAuth();

  return (
    <div>
      {user ? <Navbar2 /> : <Navbar />}
      <main>{children}</main>
      <Footer />
    </div>
  );
}
