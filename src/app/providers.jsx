"use client";

import React from "react";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import CookiePopUp from "@/components/pop-ups/CookiePopUp";

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: "#fff",
                color: "#333",
              },
              success: {
                duration: 3000,
                theme: {
                  primary: "green",
                  secondary: "black",
                },
              },
            }}
          />
          <CookiePopUp />
          {children}
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
