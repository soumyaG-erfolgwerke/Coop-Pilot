import React from "react";
import { Building2, MapPin } from "lucide-react";

const Page3 = ({ formData, handleChange, errors, selectedCooperative }) => {
  // Get directors from selected cooperative for dropdown
  const directors = selectedCooperative?.adminsName || [];
  // Get already-registered admins to grey them out
  const registeredAdmins = selectedCooperative?.regAdmin || [];

  // List of available countries
  const countries = [
    "Germany",
    "United Kingdom",
    "France",
    "Italy",
    "Netherlands",
    "Belgium",
    "Switzerland",
    "Denmark",
    "Finland",
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-tint rounded-full dark:bg-primary-dark-900/30">
          <Building2 size={32} className="text-blue-600 dark:text-primary/80" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Fill Your Business Details
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Verify and complete your cooperative information
        </p>
      </div>

      <div className="space-y-6">
        {/* Country Field - Dropdown selection disabled for now */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="country"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Country <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 z-10 flex items-center pl-3 pointer-events-none">
              <MapPin size={18} className="text-gray-400" />
            </div>
            <select
              id="country"
              name="country"
              value={formData.country || "Germany"}
              disabled
              onChange={handleChange}
              className={`mt-1 block w-full pl-10 py-2.5 pr-8 border cursor-not-allowed ${
                errors.country
                  ? "border-red-500"
                  : "border-gray-300 dark:border-slate-600"
              } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                errors.country
                  ? "focus:ring-red-500"
                  : "focus:ring-primary dark:focus:ring-primary/80"
              } sm:text-sm transition-all duration-200 appearance-none`}
            >
              <option value="">Select a Country</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
          {errors.country && (
            <p className="mt-1 text-xs text-red-500">{errors.country}</p>
          )}
        </div>

        {/* Company Name - Prefilled from selected business */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="companyName"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Company Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Building2 size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="companyName"
              name="businessName"
              value={formData.businessName || ""}
              onChange={handleChange}
              placeholder="Your Cooperative Name"
              className={`mt-1 block w-full pl-10 py-2.5 pr-3 border ${
                errors.businessName
                  ? "border-red-500"
                  : "border-gray-300 dark:border-slate-600"
              } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                errors.businessName
                  ? "focus:ring-red-500"
                  : "focus:ring-primary dark:focus:ring-primary/80"
              } sm:text-sm transition-all duration-200`}
            />
          </div>
          {errors.businessName && (
            <p className="mt-1 text-xs text-red-500">{errors.businessName}</p>
          )}
        </div>

        {/* Registered Business Name */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="registeredBusinessName"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Registered Business Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="registeredBusinessName"
            name="registeredBusinessName"
            onChange={handleChange}
            placeholder="Official registered name"
            className={`mt-1 block w-full py-2.5 px-3 border ${
              errors.registeredBusinessName
                ? "border-red-500"
                : "border-gray-300 dark:border-slate-600"
            } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${
              errors.registeredBusinessName
                ? "focus:ring-red-500"
                : "focus:ring-primary dark:focus:ring-primary/80"
            } sm:text-sm transition-all duration-200`}
          />
          {errors.registeredBusinessName && (
            <p className="mt-1 text-xs text-red-500">
              {errors.registeredBusinessName}
            </p>
          )}
        </div>

        {/* Registered Court Name - Prefilled from selected business if available */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="courtName"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Registered Court Name
          </label>
          <input
            type="text"
            id="courtName"
            name="courtName"
            value={formData.courtName || ""}
            onChange={handleChange}
            placeholder="e.g., Munich District Court"
            className={`mt-1 block w-full py-2.5 px-3 border ${
              errors.courtName
                ? "border-red-500"
                : "border-gray-300 dark:border-slate-600"
            } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${
              errors.courtName
                ? "focus:ring-red-500"
                : "focus:ring-primary dark:focus:ring-primary/80"
            } sm:text-sm transition-all duration-200`}
          />
          {errors.courtName && (
            <p className="mt-1 text-xs text-red-500">{errors.courtName}</p>
          )}
        </div>

        {/* Registration Number - Prefilled from selected business */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="registrationNumber"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Registration Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="registrationNumber"
            name="registryNumber"
            value={formData.registryNumber || ""}
            onChange={handleChange}
            placeholder="e.g., HRB 12345"
            className={`mt-1 block w-full py-2.5 px-3 border ${
              errors.registrationNumber
                ? "border-red-500"
                : "border-gray-300 dark:border-slate-600"
            } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${
              errors.registrationNumber
                ? "focus:ring-red-500"
                : "focus:ring-primary dark:focus:ring-primary/80"
            } sm:text-sm transition-all duration-200`}
          />
          {errors.registrationNumber && (
            <p className="mt-1 text-xs text-red-500">
              {errors.registrationNumber}
            </p>
          )}
        </div>

        {/* Director Selection - Dropdown from cooperative's adminsName array */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="directorName"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Director <span className="text-red-500">*</span>
          </label>
          <select
            id="directorName"
            name="directorName"
            value={formData.directorName || ""}
            onChange={handleChange}
            className={`mt-1 block w-full py-2.5 px-3 border ${
              errors.directorName
                ? "border-red-500"
                : "border-gray-300 dark:border-slate-600"
            } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${
              errors.directorName
                ? "focus:ring-red-500"
                : "focus:ring-primary dark:focus:ring-primary/80"
            } sm:text-sm transition-all duration-200`}
          >
            <option value="">Select a Director</option>
            {directors.map((director, index) => {
              const isRegistered = registeredAdmins.includes(director);
              return (
                <option
                  key={index}
                  value={director}
                  disabled={isRegistered}
                  className={isRegistered ? "text-gray-400" : ""}
                >
                  {director}{isRegistered ? " (already registered)" : ""}
                </option>
              );
            })}
          </select>
          {errors.directorName && (
            <p className="mt-1 text-xs text-red-500">{errors.directorName}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Please select your name
          </p>
        </div>
      </div>
    </div>
  );
};

export default Page3;
