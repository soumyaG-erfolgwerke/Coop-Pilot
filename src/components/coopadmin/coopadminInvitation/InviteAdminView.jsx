import { TextInputField } from "@/components/ui/input/InputFields";
import {
  sendCoopAdminInvite,
  validateEmail,
} from "@/services/onboardingServices/coopadmin/InviteHelpers";
import { Loader, Send, UserSearch, X } from "lucide-react";
import React, { useState, useCallback } from "react";
import toast from "react-hot-toast";

const InviteAdminView = ({ selectedCoop, onInviteSuccess, onClose }) => {
  const coopId = selectedCoop || null;

  const [inviteForm, setInviteForm] = useState({
    email: "",
    fullName: "",
  });
  const [isEmailValidated, setIsEmailValidated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleInputChange = useCallback(
    (field, value) => {
      if (field === "fullName" && hasExistingProfile) {
        setHasExistingProfile(false); // User is manually editing
      }
      setInviteForm((prev) => ({ ...prev, [field]: value }));
    },
    [hasExistingProfile],
  );

  const handleEmailValidation = useCallback(async () => {
    const email = inviteForm.email.trim();

    if (!email) {
      toast.error("Please enter an email address to validate.");
      return;
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsValidating(true);
    try {
      const profile = await validateEmail(email);

      if (profile?.FirstName && profile?.LastName) {
        const fullName = `${profile.FirstName} ${profile.LastName}`.trim();
        setInviteForm((prev) => ({ ...prev, fullName }));
        setHasExistingProfile(true);
        toast.success("Email validated! Name auto-filled.");
      } else {
        setInviteForm((prev) => ({ ...prev, fullName: "" }));
        setHasExistingProfile(false);
        toast.error("Email not found. Please enter name manually.");
      }
      setIsEmailValidated(true);
    } catch (error) {
      console.error("Error validating email:", error);
      toast.error("Failed to validate email. Please try again.");
      setIsEmailValidated(false);
    } finally {
      setIsValidating(false);
    }
  }, [inviteForm.email]);

  const handleInviteSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      // Validate required fields
      if (!inviteForm.email.trim()) {
        toast.error("Email address is required.");
        return;
      }

      if (!inviteForm.fullName.trim()) {
        toast.error("Full name is required.");
        return;
      }

      if (!coopId) {
        toast.error("No cooperative selected.");
        return;
      }

      setIsLoading(true);

      try {
        const result = await sendCoopAdminInvite({
          email: inviteForm.email.trim(),
          fullName: inviteForm.fullName.trim(),
          coopId: coopId,
        });
        console.log("result", result);

        // Handle response based on status
        if (result.code === 200) {
          toast.success(result.message || "Admin invite sent successfully!");
          // Reset form
          setInviteForm({ email: "", fullName: "" });
          setIsEmailValidated(false);
          setHasExistingProfile(false);
          onInviteSuccess?.();
          onClose?.();
        } else if (result.code === 409) {
          toast.error(result.message || "User already invited or is an admin.");
        } else if (result.code === 401) {
          toast.error(
            result.message || "User is already an admin of this cooperative.",
          );
        } else if (result.code === 404) {
          toast.error("Cooperative not found.");
        } else {
          toast.error(
            result.message ||
              result.error ||
              "Failed to send admin invite. Please try again.",
          );
        }
      } catch (error) {
        console.error("Error sending admin invite:", error);
        toast.error(
          error.message || "Failed to send admin invite. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [inviteForm, coopId, onInviteSuccess, onClose],
  );

  const handleEmailChange = useCallback(
    (e) => {
      handleInputChange("email", e);
      setIsEmailValidated(false);
      setHasExistingProfile(false);
    },
    [handleInputChange],
  );

  return (
    <div className="w-full p-6 mx-4 mb-8 space-y-6 rounded-lg shadow bg-gray-50 dark:bg-slate-900 backdrop-blur-sm">
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Invite New Admin
          </h2>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="flex items-center justify-center p-3 text-gray-500 bg-gray-200 rounded-full w-fit hover:bg-gray-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Enter the email address and full name of the person you want to invite
          as an admin for your cooperative.
        </p>
      </div>

      <div className="relative flex flex-col gap-4 p-4 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-slate-800">
        {(isLoading || isValidating) && (
          <div className="absolute top-0 left-0 flex items-center justify-center w-full h-full rounded-lg bg-gray-200/80 dark:bg-gray-600/80">
            <Loader className="w-8 h-8 text-gray-500 animate-spin" />
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleInviteSubmit}>
          <TextInputField
            label="Email Address"
            placeholder="Enter email to invite as admin"
            value={inviteForm.email}
            onChange={handleEmailChange}
            type="email"
            required
            disabled={isLoading || isValidating}
          />

          {isEmailValidated && (
            <TextInputField
              label="Full Name"
              placeholder="Enter full name for the new admin"
              helperText={
                hasExistingProfile ? (
                  <p className="text-green-600">
                    ✓ Account exists. Name auto-filled.
                  </p>
                ) : (
                  <p className="text-amber-600">
                    ⚠ Account not found. Enter name manually.
                  </p>
                )
              }
              value={inviteForm.fullName}
              disabled={
                isLoading || (hasExistingProfile && !!inviteForm.fullName)
              }
              onChange={(e) => handleInputChange("fullName", e)}
              required
            />
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={handleEmailValidation}
              disabled={isLoading || isValidating || !inviteForm.email}
              className="flex items-center px-4 py-2 text-white bg-blue-500 rounded-md cursor-pointer w-fit hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <UserSearch className="w-4 h-4 mr-2" />
              Check Email
            </button>

            {isEmailValidated && (
              <button
                type="submit"
                disabled={isLoading || !inviteForm.fullName.trim()}
                className="flex items-center px-4 py-2 text-white bg-green-500 rounded-md w-fit hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 mr-2" />
                Invite Admin
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteAdminView;
