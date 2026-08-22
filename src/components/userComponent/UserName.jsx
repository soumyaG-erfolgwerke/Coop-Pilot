import React, { useState, useEffect } from "react";
import useUserCache from "../../hooks/useUserCache";
import { Copy } from "lucide-react";
import highlightText from "../ui/highlightText";

const UserName = ({
  id,
  name: directName,
  email,
  highlight,
  allowEmailCopy = false,
  className = "flex-col",
}) => {
  const [name, setName] = useState(directName || "");
  const [copied, setCopied] = useState(false);

  const { getUserById } = useUserCache();

  // Handle directName prop and load cached user details as fallback
  useEffect(() => {
    // 1. If directName is provided from API, use it directly and return to prevent stale LocalStorage cache overwrite
    if (directName) {
      setName((prev) => (prev === directName ? prev : directName));
      return;
    }

    if (!id) return;

    // 2. Fallback to async user cache lookup if no directName passed
    async function loadUser() {
      const user = await getUserById(id);
      if (user?.name) {
        setName(user.name);
      }
    }

    loadUser();
  }, [id, directName, getUserById]);

  const copyEmail = async () => {
    if (!allowEmailCopy || !email) return;

    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy email to clipboard:", err);
    }
  };

  return (
    <div className={`flex ${className}`}>
      <span>{highlightText(name, highlight) || "--"}</span>

      {email &&
        (allowEmailCopy ? (
          <div className="relative mt-1 w-fit group">
            <button
              type="button"
              onClick={copyEmail}
              className="flex items-center gap-1 rounded-md border border-gray-100 bg-gray-200 text-gray-700 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 px-2 py-0.5 text-xs dark:text-gray-300 transition dark:hover:bg-gray-700 dark:hover:text-white"
            >
              <Copy size={11} />
              <span>{highlightText(email, highlight)}</span>
            </button>

            <div className="absolute hidden px-3 py-1 mb-2 text-xs text-black -translate-x-1/2 bg-gray-200 rounded-lg shadow-lg pointer-events-none bottom-full left-1/2 whitespace-nowrap group-hover:block">
              {copied ? "Copied!" : "Click to copy"}
            </div>
          </div>
        ) : (
          <span className="mt-1 text-xs text-gray-400">
            {highlightText(email, highlight)}
          </span>
        ))}
    </div>
  );
};

export default UserName;
