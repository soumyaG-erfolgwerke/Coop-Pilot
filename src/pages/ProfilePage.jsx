// src/pages/ProfilePage.jsx
import React from "react";
import ProfileUpdateForm from "../components/shared/ProfileUpdateForm";

export default function ProfilePage() {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-4">
      <h1 className="mb-2 text-3xl font-bold">Your Profile</h1>
      <p className="mb-6 text-gray-600">
        Update your personal details. Your email address cannot be changed.
      </p>
      <ProfileUpdateForm />
    </div>
  );
}
