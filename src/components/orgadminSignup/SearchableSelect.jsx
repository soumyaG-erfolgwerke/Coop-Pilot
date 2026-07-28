"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

const SearchableSelect = ({
  id,
  name,
  value,
  options = [],
  placeholder = "Select...",
  onChange,
  onBlur,
  error,
  disabled = false,
  hasIcon = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const resolvedId = id || name;
  const menuId = resolvedId ? `${resolvedId}-listbox` : undefined;

  const normalizedOptions = useMemo(
    () =>
      options.map((option) =>
        typeof option === "string"
          ? { value: option, label: option }
          : option
      ),
    [options]
  );

  const selectedOption = normalizedOptions.find((option) => option.value === value);

  const filteredOptions = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return normalizedOptions;
    return normalizedOptions.filter((option) => {
      const label = String(option.label ?? "").toLowerCase();
      const optionValue = String(option.value ?? "").toLowerCase();
      const searchValue = String(option.searchValue ?? "").toLowerCase();
      return `${label} ${optionValue} ${searchValue}`.includes(needle);
    });
  }, [normalizedOptions, searchTerm]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (!containerRef.current || containerRef.current.contains(event.target)) return;
      setIsOpen(false);
      setSearchTerm("");
      if (onBlur && name) {
        onBlur({ target: { name, value } });
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, name, onBlur, value]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (nextValue) => {
    if (disabled) return;
    if (onChange && name) {
      onChange({ target: { name, value: nextValue } });
    }
    if (onBlur && name) {
      onBlur({ target: { name, value: nextValue } });
    }
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      setSearchTerm("");
    }
  };

  const handleKeyDown = (event) => {
    if (disabled) return;
    if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setSearchTerm("");
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setSearchTerm("");
      if (onBlur && name) {
        onBlur({ target: { name, value } });
      }
    }
  };

  const buttonClassName = `mt-1 block w-full text-left ${
    hasIcon ? "pl-10" : "pl-3"
  } py-2.5 pr-10 border ${
    error ? "border-red-500" : "border-gray-300 dark:border-slate-600"
  } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${
    error ? "focus:ring-red-500" : "focus:ring-primary dark:focus:ring-primary/80"
  } sm:text-sm transition-all duration-200 ${
    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
  } ${className}`.trim();

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={resolvedId}
        className={buttonClassName}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        disabled={disabled}
      >
        <span
          className={`block truncate ${
            selectedOption ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500"
          }`}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronDown size={16} className="text-gray-500" />
        </span>
      </button>

      {isOpen && !disabled && (
        <div
          id={menuId}
          role="listbox"
          className="absolute z-50 w-full mt-1 overflow-y-auto overflow-x-hidden bg-white border border-gray-200 rounded-md shadow-lg dark:bg-slate-800 dark:border-slate-700 max-h-60"
        >
          <div className="sticky top-0 z-10 p-2 bg-white border-b border-gray-100 dark:border-slate-700 dark:bg-slate-800">
            <div className="relative">
              <Search size={14} className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-center text-gray-500">No options found</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  type="button"
                  key={`${option.value}-${option.label}`}
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 dark:hover:bg-primary-dark-900/20 transition-colors ${
                    option.value === value
                      ? "bg-blue-50 dark:bg-primary-dark-900/20 text-blue-600"
                      : "text-gray-700 dark:text-gray-200"
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
