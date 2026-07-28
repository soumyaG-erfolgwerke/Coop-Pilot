"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Sun, Moon, Menu, X, LayoutDashboard, LogOut } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function ProxyLayout({ children }) {
  const params = useParams();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const coopId = typeof params?.coopId === "string" ? params.coopId : "";
  const assemblyId = typeof params?.assemblyId === "string" ? params.assemblyId : "";
  const [proxySession, setProxySession] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const validateSession = async () => {
      try {
        const response = await fetch("/api/assembly/proxy/session");

        const result = await response.json();

        if (!result.success) {
          router.replace(`/${coopId}/assembly/${assemblyId}/proxy`);

          return;
        }

        setProxySession(result.proxy);
      } catch (error) {
        console.error(error);

        router.replace(`/${coopId}/assembly/${assemblyId}/proxy`);
      }
    };

    if (coopId && assemblyId) {
      validateSession();
    }
  }, [coopId, assemblyId, router]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/assembly/proxy/logout", {
        method: "POST",
      });
    } catch (error) {
      console.error(error);
    }

    router.replace(`/${coopId}/assembly/${assemblyId}/proxy`);
  };

  const proxyUser = proxySession
    ? {
        name: proxySession.proxyHolderName,

        email: proxySession.proxyHolderEmail,

        role: "proxy",
      }
    : null;

  const UserAvatar = ({ name }) => {
    const initials = name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "?";

    return (
      <div className="flex items-center justify-center w-10 h-10 text-lg font-bold text-white bg-blue-600 rounded-full">
        {initials}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <nav className="sticky top-0 z-50 bg-white shadow-lg dark:bg-gray-900">
        <div className="container px-6 mx-auto sm:px-8 lg:px-10">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href={`/${coopId}/assembly/${assemblyId}/proxy/dashboard`}
                className="flex-shrink-0"
              >
                <h1 className="text-3xl font-bold text-primary dark:text-dark-tint">
                  Coop-Pilot
                </h1>
              </Link>
            </div>

            <div className="hidden md:block">
              <div className="flex items-baseline ml-10 space-x-8"></div>
            </div>

            <div className="items-center hidden space-x-6 md:flex">
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-600 transition-colors duration-300 rounded-full dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              </button>

              {proxyUser && (
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center p-2 space-x-3 transition-all duration-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <UserAvatar name={proxyUser.name} />

                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {proxyUser.name}
                    </span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center md:hidden">
              <button
                onClick={toggleTheme}
                className="p-2 mr-2 text-gray-600 rounded-full dark:text-gray-400 focus:outline-none"
              >
                {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-gray-600 rounded-md dark:text-gray-400 focus:outline-none"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="bg-white border-t border-gray-200 md:hidden dark:bg-gray-900 dark:border-gray-700">
            <div className="px-4 pt-4 pb-3 space-y-1">
              <div className="my-4 border-t border-gray-200 dark:border-gray-700" />
              {proxyUser && (
                <div className="px-4">
                  <div className="flex items-center mb-3">
                    <UserAvatar name={proxyUser.name} />

                    <div className="ml-3">
                      <p className="text-base font-medium text-gray-800 dark:text-white">
                        {proxyUser.name}
                      </p>

                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {proxyUser.email}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/${coopId}/assembly/${assemblyId}/proxy/dashboard`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center w-full px-4 py-2 text-base font-medium text-left text-gray-700 rounded-md dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <LayoutDashboard size={20} className="mr-3" />
                    Dashboard
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 mt-2 text-base font-medium text-left text-gray-700 rounded-md dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <LogOut size={20} className="mr-3" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      <main>{children}</main>
    </div>
  );
}
