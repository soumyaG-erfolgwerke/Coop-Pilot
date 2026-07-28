import React from "react";
import { MapPin, Home, Mail } from "lucide-react";

const Page6 = ({ formData, handleChange, errors }) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-full dark:bg-indigo-900/30">
          <MapPin size={32} className="text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Enter your Address
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Please provide your residential address details
        </p>
      </div>

      <div className="space-y-6">
        {/* Street */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="street"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Street <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MapPin size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="street"
              name="street"
              value={formData.street || ""}
              onChange={handleChange}
              placeholder="Main Street"
              className={`mt-1 block w-full pl-10 py-2.5 pr-3 border ${
                errors.street
                  ? "border-red-500"
                  : "border-gray-300 dark:border-slate-600"
              } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                errors.street
                  ? "focus:ring-red-500"
                  : "focus:ring-primary dark:focus:ring-primary/80"
              } sm:text-sm transition-all duration-200`}
            />
          </div>
          {errors.street && (
            <p className="mt-1 text-xs text-red-500">{errors.street}</p>
          )}
        </div>

        {/* House No */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="houseNo"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            House No <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Home size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="houseNo"
              name="houseNo"
              value={formData.houseNo || ""}
              onChange={handleChange}
              placeholder="123"
              maxLength={5}
              className={`mt-1 block w-full pl-10 py-2.5 pr-3 border ${
                errors.houseNo
                  ? "border-red-500"
                  : "border-gray-300 dark:border-slate-600"
              } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                errors.houseNo
                  ? "focus:ring-red-500"
                  : "focus:ring-primary dark:focus:ring-primary/80"
              } sm:text-sm transition-all duration-200`}
            />
          </div>
          {errors.houseNo && (
            <p className="mt-1 text-xs text-red-500">{errors.houseNo}</p>
          )}
        </div>

        {/* Postal Code */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="postalCode"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Postal Code <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Mail size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              value={formData.postalCode || ""}
              onChange={handleChange}
              placeholder="12345"
              maxLength={10}
              className={`mt-1 block w-full pl-10 py-2.5 pr-3 border ${
                errors.postalCode
                  ? "border-red-500"
                  : "border-gray-300 dark:border-slate-600"
              } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                errors.postalCode
                  ? "focus:ring-red-500"
                  : "focus:ring-primary dark:focus:ring-primary/80"
              } sm:text-sm transition-all duration-200`}
            />
          </div>
          {errors.postalCode && (
            <p className="mt-1 text-xs text-red-500">{errors.postalCode}</p>
          )}
        </div>

        {/* Location (placeholder city) */}
        <div className="animate-fadeInUp">
          <label
            htmlFor="location"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Location <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <MapPin size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location || ""}
              onChange={handleChange}
              placeholder="City"
              className={`mt-1 block w-full pl-10 py-2.5 pr-3 border ${
                errors.location
                  ? "border-red-500"
                  : "border-gray-300 dark:border-slate-600"
              } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${
                errors.location
                  ? "focus:ring-red-500"
                  : "focus:ring-primary dark:focus:ring-primary/80"
              } sm:text-sm transition-all duration-200`}
            />
          </div>
          {errors.location && (
            <p className="mt-1 text-xs text-red-500">{errors.location}</p>
          )}
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Enter your city name
          </p>
        </div>
      </div>
    </div>
  );
};

export default Page6;
