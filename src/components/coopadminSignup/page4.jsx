import React from "react";
import { Building2, User, Briefcase, Users } from "lucide-react";

const Page4 = ({
  formData,
  handleChange,
  errors,
  selectedCooperative,
  sectors,
}) => {
  // Size options for company/cooperative
  // Values are integers (1-4) for database storage
  const sizeOptions = [
    { value: 1, label: "2-10 employees" },
    { value: 2, label: "11-50 employees" },
    { value: 3, label: "51-250 employees" },
    { value: 4, label: "250+ employees" },
  ];

  // Get the selected director's first name from formData.directorName (from page 3)
  const selectedDirectorFirstName = formData.directorName
    ? formData.directorName.split(" ")[0]
    : "Director";

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full dark:bg-purple-900/30">
          <User size={32} className="text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Welcome {selectedDirectorFirstName}!
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Tell us about your business
        </p>
      </div>

      <div className="space-y-6">
        {/* Country Field */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="businessCountry"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Country <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="businessCountry"
              name="businessCountry"
              value={formData.country || "Germany"}
              disabled
              className="mt-1 block w-full py-2.5 px-3 border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 rounded-md shadow-sm sm:text-sm text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Company Name - Prefilled from selected cooperative */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="companyNamePage4"
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
              id="companyNamePage4"
              name="companyNamePage4"
              value={formData.companyName || formData.businessName || ""}
              disabled
              className="mt-1 block w-full pl-10 py-2.5 pr-3 border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 rounded-md shadow-sm sm:text-sm text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Registration Number - Prefilled */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="registrationNumberPage4"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Registration Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="registrationNumberPage4"
            name="registrationNumberPage4"
            value={
              formData.registrationNumber ||
              formData.registryNumber ||
              selectedCooperative?.RegNumber ||
              ""
            }
            disabled
            className="mt-1 block w-full py-2.5 px-3 border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 rounded-md shadow-sm sm:text-sm text-gray-600 dark:text-gray-400 cursor-not-allowed"
          />
        </div>

        {/* Director Name - Display only, from previous selection */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="directorNameDisplay"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Director <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <User size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="directorNameDisplay"
              name="directorNameDisplay"
              value={formData.directorName || ""}
              disabled
              className="mt-1 block w-full pl-10 py-2.5 pr-3 border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 rounded-md shadow-sm sm:text-sm text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Business Sector - Dropdown from backend/mock */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="businessSector"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Business Sector <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 z-10 flex items-center pl-3 pointer-events-none">
              <Briefcase size={18} className="text-gray-400" />
            </div>
            <select
              id="businessSector"
              name="businessSector"
              value={formData.businessSector || ""}
              onChange={handleChange}
              className={`mt-1 block w-full pl-10 py-2.5 pr-8 border ${
                errors.businessSector
                  ? "border-red-500"
                  : "border-gray-300 dark:border-slate-600"
              } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                errors.businessSector
                  ? "focus:ring-red-500"
                  : "focus:ring-primary dark:focus:ring-primary/80"
              } sm:text-sm transition-all duration-200 appearance-none`}
            >
              <option value="">Select Sector</option>
              {sectors.map((sector) => (
                <option key={sector.key} value={sector.key}>
                  {sector.name}
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
          {errors.businessSector && (
            <p className="mt-1 text-xs text-red-500">{errors.businessSector}</p>
          )}
        </div>

        {/* Describe Your Business */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="businessDescription"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Describe Your Business
          </label>
          <textarea
            id="businessDescription"
            name="businessDescription"
            value={formData.businessDescription || ""}
            onChange={handleChange}
            placeholder="Tell us about your cooperative's activities and goals (minimum 50 characters)..."
            rows={4}
            className={`mt-1 block w-full py-2.5 px-3 border ${
              errors.businessDescription
                ? "border-red-500"
                : "border-gray-300 dark:border-slate-600"
            } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${
              errors.businessDescription
                ? "focus:ring-red-500"
                : "focus:ring-primary dark:focus:ring-primary/80"
            } sm:text-sm transition-all duration-200 resize-none`}
          />
          {errors.businessDescription && (
            <p className="mt-1 text-xs text-red-500">
              {errors.businessDescription}
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Minimum 50 characters
          </p>
        </div>

        {/* Size - Dropdown */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="size"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Size <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 z-10 flex items-center pl-3 pointer-events-none">
              <Users size={18} className="text-gray-400" />
            </div>
            <select
              id="size"
              name="size"
              value={formData.size || ""}
              onChange={handleChange}
              className={`mt-1 block w-full pl-10 py-2.5 pr-8 border ${
                errors.size
                  ? "border-red-500"
                  : "border-gray-300 dark:border-slate-600"
              } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                errors.size
                  ? "focus:ring-red-500"
                  : "focus:ring-primary dark:focus:ring-primary/80"
              } sm:text-sm transition-all duration-200 appearance-none`}
            >
              <option value="">Select Size</option>
              {sizeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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
          {errors.size && (
            <p className="mt-1 text-xs text-red-500">{errors.size}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Number of employees in your cooperative
          </p>
        </div>
      </div>
    </div>
  );
};

export default Page4;
