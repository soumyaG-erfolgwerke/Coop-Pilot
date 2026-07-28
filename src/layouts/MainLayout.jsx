"use client";

import Navbar from "@/components/shared/Navbar_v2";
import Footer from "@/components/shared/Footer_v2";
import { Navbar as Navbar2 } from "../components/Navbar";
import { useAuth } from "../hooks/useAuth";


export default function MainLayout({ children }) {
    const { user, logout } = useAuth();
  return (
    <div>
      {user? <Navbar2 /> :  <Navbar />}

      <main>
        {children}
      </main>
      <Footer />
    </div>
  );
}
