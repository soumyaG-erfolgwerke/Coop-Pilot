"use client";

// src/components/ProtectedRoute.jsx
import { usePathname } from "next/navigation";
import NotFoundPage from "./NotFoundPage";
import AdminPage from "./AdminPage";
import SuperAdminPage from "./SuperAdminPage";
import MemberPage from "./MemberPage";
import { useAuth } from "../hooks/useAuth";
import GovAuditorPage from "./GovAuditerPage";
import CreateCooperativeForm from "../components/CreateCooperativeForm";

const LoginRequiredPage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <h1 className="mb-4 text-2xl font-bold text-gray-800 dark:text-gray-100">
      Login Required
    </h1>
    <p className="mb-6 text-gray-600 dark:text-gray-300">
      Please signin first to create a cooperative.
    </p>
    <a
      href="/signinpage"
      className="px-6 py-2 text-white bg-blue-600 shadow-md rounded-xl hover:bg-blue-700"
    >
      Go to Login
    </a>
  </div>
);

export default function ProtectedCreateCoop() {
  const { user } = useAuth();
  const pathname = usePathname();
  // console.log(user)

  if (!user) {
    return <LoginRequiredPage />;
  } else {
    return <CreateCooperativeForm />;
  }
}
