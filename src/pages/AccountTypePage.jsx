"use client";

import React from "react";
import { User, LogIn, PlusCircle, Handshake } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";

const AccountTypePage = () => {
  const router = useRouter();
  const { language } = useLanguage();

  return (
    <div className="flex flex-col justify-center min-h-screen py-12 bg-gray-50 dark:bg-gray-900 sm:px-6 lg:px-8 font-inter">
      <div className="text-center sm:mx-auto sm:w-full sm:max-w-3xl">
        <button className="mb-4 px-4 py-1.5 text-sm font-medium text-blue-700 bg-tint rounded-full cursor-default">
          {language === "de" ? "Wählen Sie eine Option" : "Choose an option"}
        </button>
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl dark:text-white">
          {language === "de" ? "Digitale Tools für moderne Genossenschaften" : "Digital tools for modern cooperatives"}
        </h2>
        <p className="max-w-xl mx-auto mt-3 text-gray-600 text-md sm:text-lg dark:text-gray-400">
          {language === "de"
            ? "Bleiben Sie konform mit den europäischen Vorschriften für Genossenschaften."
            : "Stay compliant with European regulations for cooperatives."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 mt-10 sm:mx-auto sm:w-full sm:max-w-3xl md:grid-cols-2">
        {/* Sign In Option */}
        <div className="flex flex-col items-center p-6 text-center bg-white shadow-lg dark:bg-gray-800 rounded-xl">
          <div className="p-3 mb-4 rounded-full bg-tint dark:bg-primary-dark-900">
            <User className="w-8 h-8 text-blue-600 dark:text-primary/80" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            {language === "de" ? "Als Mitglied registrieren" : "Sign Up as Member"}
          </h3>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            {language === "de"
              ? "Treten Sie einer bestehenden Genossenschaft bei und verwalten Sie Ihr Portfolio."
              : "Join an existing cooperative, and manage your portfolio."}
          </p>
          <button
            onClick={() => router.push("/member-signup")}
            className="flex items-center justify-center px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <LogIn className="w-5 h-5 mr-2" /> {language === "de" ? "Registrieren" : "Sign Up"}
          </button>
        </div>

        {/* Add Cooperative Option */}
        <div className="flex flex-col items-center p-6 text-center bg-white shadow-lg dark:bg-gray-800 rounded-xl">
          <div className="p-3 mb-4 bg-green-100 rounded-full dark:bg-green-900">
            <Handshake className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
            {language === "de" ? "Als Geschäftsführer registrieren" : "Sign Up as Geschäftsführer"}
          </h3>
          <p className="mb-6 text-gray-600 dark:text-gray-300">
            {language === "de"
              ? "Registrieren Sie eine neue Genossenschaft, um Mitglieder und Abläufe zu verwalten."
              : "Register a new cooperative to start managing members and operations."}
          </p>
          <button
            onClick={() => router.push("/coopadmin-signup-v2")}
            className="flex items-center justify-center px-6 py-3 text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            <PlusCircle className="w-5 h-5 mr-2" /> {language === "de" ? "Jetzt beitreten" : "Join Now"}
          </button>
        </div>
      </div>

      {/* Already have an account section */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          {language === "de" ? "Haben Sie bereits ein Konto? " : "Already have an account? "}
          <button
            onClick={() => router.push("/signinpage")}
            className="font-medium text-blue-600 hover:text-blue-500 hover:underline dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            {language === "de" ? "Anmelden" : "Sign in"}
          </button>
        </p>
      </div>
      
    </div>
  );
};

export default AccountTypePage;