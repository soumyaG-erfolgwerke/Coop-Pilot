"use client";
import React, { useState } from "react";
import { Search, Building2, CheckCircle, ChevronRight } from "lucide-react";

const Page2 = ({
  handleChange,
  errors,
  onSelectBusiness,
  cooperatives, // Receive cooperatives data from parent
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchType, setSearchType] = useState("name"); // 'name' or 'regNumber'

  // Search function to filter cooperatives
  const handleSearch = (query) => {
    setSearchQuery(query);

    if (query.trim().length > 0) {
      // Filter cooperatives based on search type (name or registration number)
      const filtered = cooperatives.filter((coop) => {
        if (searchType === "name") {
          return coop.name.toLowerCase().includes(query.toLowerCase());
        } else {
          return coop.RegNumber.toLowerCase().includes(query.toLowerCase());
        }
      });

      // Limit to top 4 results
      setSuggestions(filtered.slice(0, 4));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle business selection
  const handleBusinessSelect = (business) => {
    setSelectedBusiness(business);
    setSearchQuery(business.name);
    setShowSuggestions(false);

    // Update form data with selected business
    handleChange({
      target: { name: "businessName", value: business.name },
    });
    handleChange({
      target: { name: "registryNumber", value: business.RegNumber },
    });
  };

  // Handle continue button click
  const handleContinue = () => {
    if (selectedBusiness && onSelectBusiness) {
      onSelectBusiness(selectedBusiness);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-tint rounded-full dark:bg-primary-dark-900/30">
          <Building2 size={32} className="text-blue-600 dark:text-primary/80" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Search Your Business
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Find and select your cooperative
        </p>
      </div>

      {/* Search Input Section */}
      <div className="space-y-4">
        {/* Search Type Toggle */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setSearchType("name");
              setSearchQuery("");
              setSuggestions([]);
              setShowSuggestions(false);
            }}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              searchType === "name"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600"
            }`}
          >
            Search by Name
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchType("regNumber");
              setSearchQuery("");
              setSuggestions([]);
              setShowSuggestions(false);
            }}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              searchType === "regNumber"
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600"
            }`}
          >
            Search by Reg. Number
          </button>
        </div>

        <div className="relative animate-fadeInUp">
          <label
            htmlFor="businessSearch"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {searchType === "name" ? "Business Name" : "Registration Number"}{" "}
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              id="businessSearch"
              name="businessSearch"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={
                searchType === "name"
                  ? "Type your business name..."
                  : "Type registration number (e.g., HRB 12345)..."
              }
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

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 overflow-hidden bg-white border border-gray-300 rounded-md shadow-lg dark:bg-slate-700 dark:border-slate-600">
              <div className="overflow-y-auto max-h-60">
                {suggestions.map((business, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleBusinessSelect(business)}
                    className="w-full px-4 py-3 text-left transition-colors border-b border-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600 dark:border-slate-600 last:border-b-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-white">
                          {business.name}
                        </p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {business.RegNumber} • {business.state}
                        </p>
                      </div>
                      {selectedBusiness?.RegNumber === business.RegNumber && (
                        <CheckCircle
                          size={18}
                          className="flex-shrink-0 ml-2 text-green-500"
                        />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No results message */}
          {showSuggestions &&
            suggestions.length === 0 &&
            searchQuery.trim() && (
              <div className="absolute z-10 w-full p-4 mt-1 bg-white border border-gray-300 rounded-md shadow-lg dark:bg-slate-700 dark:border-slate-600">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No businesses found. Please try a different search term.
                </p>
              </div>
            )}
        </div>

        {/* Selected Business Display */}
        {selectedBusiness && (
          <div className="p-4 border border-green-200 rounded-lg bg-green-50 dark:bg-green-900/20 dark:border-green-800 animate-fadeIn">
            <div className="flex items-start">
              <CheckCircle
                size={20}
                className="text-green-600 dark:text-green-400 mr-3 mt-0.5 flex-shrink-0"
              />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-800 dark:text-green-200">
                  Selected Business
                </h3>
                <p className="mt-1 text-sm font-medium text-green-900 dark:text-green-100">
                  {selectedBusiness.name}
                </p>
                <div className="flex flex-wrap gap-2 mt-2 text-xs text-green-700 dark:text-green-300">
                  <span className="px-2 py-1 bg-green-100 rounded dark:bg-green-900/40">
                    {selectedBusiness.RegNumber}
                  </span>
                  <span className="px-2 py-1 bg-green-100 rounded dark:bg-green-900/40">
                    {selectedBusiness.CourtName}
                  </span>
                  <span className="px-2 py-1 bg-green-100 rounded dark:bg-green-900/40">
                    {selectedBusiness.state}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Continue Button - Only show when business is selected */}
        {selectedBusiness && (
          <button
            type="button"
            onClick={handleContinue}
            className="flex items-center justify-center w-full px-6 py-3 text-sm font-medium text-white transition-all duration-200 bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 hover:shadow-lg group animate-fadeIn"
          >
            Continue
            <ChevronRight
              size={18}
              className="ml-2 transition-transform duration-200 group-hover:translate-x-1"
            />
          </button>
        )}
      </div>

      {/* Info Box */}
      <div className="p-4 mt-6 border border-blue-200 rounded-lg bg-blue-50 dark:bg-primary-dark-900/20 dark:border-blue-800">
        <h3 className="mb-2 text-sm font-semibold text-blue-primary dark:text-blue-200">
          How it works:
        </h3>
        <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
          <li>
            Type your business name / registration number in the search field
            and we find it for you.
            <br /> Simple, fast and effcient like the way we are
          </li>
          {/* <li>• API will search and return matching businesses</li>
          <li>• Select your business from the suggestions</li>
          <li>
            • Business details (name and registration number) will be
            auto-filled
          </li> */}
        </ul>
      </div>

      {/* Info Box */}
      {/* <div className="p-4 border border-purple-200 rounded-lg bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800">
        <h3 className="mb-2 text-sm font-semibold text-purple-800 dark:text-purple-200">
          Info:
        </h3>
        <p className="text-xs text-purple-700 dark:text-purple-300">
          <strong>PointInfo:</strong>{" "}
          <code className="px-1 py-0.5 bg-purple-100 dark:bg-purple-900/40 rounded">
            moreInfo
          </code>
        </p>
        <p className="mt-1 text-xs text-purple-700 dark:text-purple-300">
          other info
        </p>
      </div> */}
    </div>
  );
};

export default Page2;
