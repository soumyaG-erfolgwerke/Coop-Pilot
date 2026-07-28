"use client";

import React, { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  // Return a default object during SSR/prerendering when context is null
  if (context === null) {
    return {
      user: null,
      isLoading: true,
      login: async () => {},
      logout: async () => {},
      register: async () => {},
      checkSessionAndFetchDetails: async () => {},
    };
  }
  return context;
};
