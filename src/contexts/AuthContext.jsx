"use client";

import React, { createContext, useState, useEffect, useContext } from "react";

// 2. Create the Authentication Context
export const AuthContext = createContext(null);

// 3. Create the AuthProvider Component
export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  // --- Check session via API route ---
  const checkSessionAndFetchDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/session", {
        method: "GET",
        credentials: "include", // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
      console.info(
        "No active user session or failed to fetch details.",
        error.message,
      );
    }
    setIsLoading(false);
  };

  // Check for an active session on component mount
  useEffect(() => {
    checkSessionAndFetchDetails();
  }, []);

  // --- Core Authentication Functions ---

  const login = async (email, password, router, captchaToken) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, captchaToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      setUser(data.user);
      router.push("/dashboard");
    } catch (error) {
      // console.error("Login Failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (router) => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setUser(null);
      router.push("/");
    } catch (error) {
      // console.error("Logout Failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Automatically log in the user after successful registration
      await login(email, password, { push: () => {} });
    } catch (error) {
      // console.error("Registration Failed:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // The value provided to consuming components
  const contextValue = {
    user,
    isLoading,
    login,
    logout,
    register,
    refreshUserData: checkSessionAndFetchDetails,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
