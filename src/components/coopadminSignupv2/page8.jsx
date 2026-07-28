"use client";

import React from "react";
import { MapPin, User, Phone, Calendar } from "lucide-react";

const Page8 = ({ formData, handleChange, errors }) => {
  // Countries of Residence list for dropdown
  const countries = [
    "Germany",
    "United Kingdom",
    "France",
    "Italy",
    "Netherlands",
    "Belgium",
    "Austria",
    "Switzerland",
  ];

  // Prefill name fields from director selection if not already filled
  // Split the director name into first/middle and last name
  React.useEffect(() => {
    if (
      formData.directorName &&
      !formData.fullLegalFirstMiddleName &&
      !formData.fullLegalLastName
    ) {
      const nameParts = formData.directorName.trim().split(/\s+/);

      const lastName =
        nameParts.length > 1 ? nameParts[nameParts.length - 1] : "";

      const firstMiddleName =
        nameParts.length > 1
          ? nameParts.slice(0, -1).join(" ")
          : nameParts[0] || "";

      handleChange({
        target: {
          name: "fullLegalFirstMiddleName",

          value: firstMiddleName,
        },
      });

      handleChange({
        target: {
          name: "fullLegalLastName",

          value: lastName,
        },
      });
    }
  }, [
    formData.directorName,
    formData.fullLegalFirstMiddleName,
    formData.fullLegalLastName,
    handleChange,
  ]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full dark:bg-indigo-900/30">
          <User size={32} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Just Cross Checking
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Tell a bit about yourself
        </p>
      </div>

      <div className="space-y-6">
        {/* Country of Residence */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="countryOfResidence"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Country of Residence <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 z-10 flex items-center pl-3 pointer-events-none">
              <MapPin size={18} className="text-gray-400" />
            </div>
            <select
              id="countryOfResidence"
              name="countryOfResidence"
              value={formData.countryOfResidence || "Germany"}
              disabled
              onChange={handleChange}
              className={`mt-1 block w-full pl-10 py-2.5 pr-8 border cursor-not-allowed ${errors.countryOfResidence
                ? "border-red-500"
                : "border-gray-300 dark:border-slate-600"
                } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.countryOfResidence
                  ? "focus:ring-red-500"
                  : "focus:ring-primary dark:focus:ring-primary/80"
                } sm:text-sm transition-all duration-200 appearance-none`}
            >
              <option value="">Select Country</option>
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
          {errors.countryOfResidence && (
            <p className="mt-1 text-xs text-red-500">
              {errors.countryOfResidence}
            </p>
          )}
        </div>

        {/* Nationality */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="nationality"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Nationality <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="nationality"
              name="nationality"
              value={formData.nationality || "Germany"}
              disabled
              className="mt-1 block w-full py-2.5 px-3 border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 rounded-md shadow-sm sm:text-sm text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Full Legal First and Middle Name */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="fullLegalFirstMiddleName"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Full Legal First and Middle Name{" "}
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <User size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="fullLegalFirstMiddleName"
              name="fullLegalFirstMiddleName"
              value={formData.fullLegalFirstMiddleName || ""}
              onChange={handleChange}
              placeholder="John Michael"
              className={`mt-1 block w-full pl-10 py-2.5 pr-3 border ${errors.fullLegalFirstMiddleName
                ? "border-red-500"
                : "border-gray-300 dark:border-slate-600"
                } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.fullLegalFirstMiddleName
                  ? "focus:ring-red-500"
                  : "focus:ring-primary dark:focus:ring-primary/80"
                } sm:text-sm transition-all duration-200`}
            />
          </div>
          {errors.fullLegalFirstMiddleName && (
            <p className="mt-1 text-xs text-red-500">
              {errors.fullLegalFirstMiddleName}
            </p>
          )}
        </div>

        {/* Full Legal Last Name */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="fullLegalLastName"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Full Legal Last Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <User size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="fullLegalLastName"
              name="fullLegalLastName"
              value={formData.fullLegalLastName || ""}
              onChange={handleChange}
              placeholder="Doe"
              className={`mt-1 block w-full pl-10 py-2.5 pr-3 border ${errors.fullLegalLastName
                ? "border-red-500"
                : "border-gray-300 dark:border-slate-600"
                } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.fullLegalLastName
                  ? "focus:ring-red-500"
                  : "focus:ring-primary dark:focus:ring-primary/80"
                } sm:text-sm transition-all duration-200`}
            />
          </div>
          {errors.fullLegalLastName && (
            <p className="mt-1 text-xs text-red-500">
              {errors.fullLegalLastName}
            </p>
          )}
        </div>

        {/* Phone Number with Country Code */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="phoneNumber"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {/* Country Code Dropdown */}
            <div className="relative w-32">
              <select
                id="phoneCountryCode"
                name="phoneCountryCode"
                value={formData.phoneCountryCode || "+49"}
                onChange={handleChange}
                className={`mt-1 block w-full py-2.5 pl-3 pr-8 border ${errors.phoneCountryCode
                  ? "border-red-500"
                  : "border-gray-300 dark:border-slate-600"
                  } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.phoneCountryCode
                    ? "focus:ring-red-500"
                    : "focus:ring-primary dark:focus:ring-primary/80"
                  } sm:text-sm transition-all duration-200 appearance-none`}
              >
                {/* <option value="+91">🇮🇳 +91</option> //TODO: testing purpose */}
                <option value="+49">🇩🇪 +49</option>
                <option value="+33">🇫🇷 +33</option>
                <option value="+39">🇮🇹 +39</option>
                <option value="+31">🇳🇱 +31</option>
                <option value="+32">🇧🇪 +32</option>
                <option value="+43">🇦🇹 +43</option>
                <option value="+41">🇨🇭 +41</option>
                <option value="+34">🇪🇸 +34</option>
                <option value="+351">🇵🇹 +351</option>
                <option value="+45">🇩🇰 +45</option>
                <option value="+46">🇸🇪 +46</option>
                <option value="+47">🇳🇴 +47</option>
                <option value="+358">🇫🇮 +358</option>
                <option value="+44">🇬🇧 +44</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 mt-1 pointer-events-none">
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
            {/* Phone Number Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Phone size={18} className="text-gray-400" />
              </div>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber || ""}
                onChange={(e) => {
                  e.target.value = e.target.value.replace(/[^0-9\s\-()+]/g, "");
                  handleChange(e);
                }}
                placeholder="123 456 7890"
                className={`mt-1 block w-full pl-10 py-2.5 pr-3 border ${errors.phoneNumber
                  ? "border-red-500"
                  : "border-gray-300 dark:border-slate-600"
                  } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.phoneNumber
                    ? "focus:ring-red-500"
                    : "focus:ring-primary dark:focus:ring-primary/80"
                  } sm:text-sm transition-all duration-200`}
              />
            </div>
          </div>
          {errors.phoneNumber && (
            <p className="mt-1 text-xs text-red-500">{errors.phoneNumber}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="dateOfBirth"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Calendar size={18} className="text-gray-400" />
            </div>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth || ""}
              onChange={handleChange}
              className={`mt-1 block w-full pl-10 py-2.5 pr-3 border ${errors.dateOfBirth
                ? "border-red-500"
                : "border-gray-300 dark:border-slate-600"
                } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${errors.dateOfBirth
                  ? "focus:ring-red-500"
                  : "focus:ring-primary dark:focus:ring-primary/80"
                } sm:text-sm transition-all duration-200`}
            />
          </div>
          {errors.dateOfBirth && (
            <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page8;
