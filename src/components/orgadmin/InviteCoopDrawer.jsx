import ResponsiveDrawer from "@/components/shared/ResponsiveDrawer";
import TextInput from "@/components/orgadminSignup/TextInput";
import InputFieldWrapper from "@/components/orgadminSignup/InputFieldWrapper";
import { toast } from "react-hot-toast";
import React, { useState, useEffect } from "react";
import { inviteCoop } from "@/lib/inviteCoopService";

const InviteCoopDrawer = ({ isOpen, onClose, auditOrgId, onInviteSuccess }) => {
  const [formData, setFormData] = useState({
    directorName: "",
    directorEmail: "",
    coopName: "",
    RegNumber: "",
  });

  const [error, setError] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (name, value) => {
    let message = "";

    if (!value.trim()) {
      switch (name) {
        case "directorEmail":
          message = "Director's email is required";
          break;
        case "coopName":
          message = "Cooperative name is required";
          break;
        case "RegNumber":
          message = "Registry number is required";
          break;
        case "directorName":
          message = "Director's name is required";
          break;
        default:
          break;
      }
    }

    setError((prev) => ({
      ...prev,
      [name]: message,
    }));
    return message === "";
  };

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        directorEmail: "",
        coopName: "",
        RegNumber: "",
        directorName: "",
      });

      setError({});
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    if (
      !validateField("directorEmail", formData.directorEmail) ||
      !validateField("coopName", formData.coopName) ||
      !validateField("RegNumber", formData.RegNumber) ||
      !validateField("directorName", formData.directorName)
    ) {
      setIsLoading(false);
      return;
    }
    try {
      const response = await inviteCoop({
        ...formData,
        auditOrgId: auditOrgId,
      });
      if (response.success) {
        toast.success("Invitation sent successfully!");
        setFormData({
          directorEmail: "",
          coopName: "",
          RegNumber: "",
          directorName: "",
        });
        onInviteSuccess?.();
      } else {
        toast.error("Failed to send invitation. Please try again.");
      }
      setIsLoading(false);
      onClose();
    } catch (error) {
      toast.error("Failed to send invitation. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <ResponsiveDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Cooperative"
    >
      <div>
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            <InputFieldWrapper
              label="Director's Name"
              htmlFor="directorName"
              error={error?.directorName}
              required
            >
              <TextInput
                id="directorName"
                name="directorName"
                placeholder="John Doe"
                value={formData.directorName}
                onChange={(e) =>
                  setFormData({ ...formData, directorName: e.target.value })
                }
                error={error?.directorName}
                onBlur={() =>
                  validateField("directorName", formData.directorName)
                }
              />
            </InputFieldWrapper>
            <InputFieldWrapper
              label="Director's Email"
              htmlFor="directorEmail"
              error={error?.directorEmail}
              required
            >
              <TextInput
                id="directorEmail"
                name="directorEmail"
                placeholder="director@example.com"
                value={formData.directorEmail}
                onChange={(e) =>
                  setFormData({ ...formData, directorEmail: e.target.value })
                }
                error={error?.directorEmail}
                onBlur={() =>
                  validateField("directorEmail", formData.directorEmail)
                }
              />
            </InputFieldWrapper>

            <InputFieldWrapper
              label="Cooperative Name"
              htmlFor="coopName"
              error={error?.coopName}
              required
            >
              <TextInput
                id="coopName"
                name="coopName"
                placeholder="ABC Cooperative Society"
                value={formData.coopName}
                onChange={(e) =>
                  setFormData({ ...formData, coopName: e.target.value })
                }
                error={error?.coopName}
                onBlur={() => validateField("coopName", formData.coopName)}
              />
            </InputFieldWrapper>

            <InputFieldWrapper
              label="Registry Number"
              htmlFor="RegNumber"
              error={error?.RegNumber}
              required
            >
              <TextInput
                id="RegNumber"
                name="RegNumber"
                placeholder="REG-123456"
                value={formData.RegNumber}
                onChange={(e) =>
                  setFormData({ ...formData, RegNumber: e.target.value })
                }
                error={error?.RegNumber}
                onBlur={() => validateField("RegNumber", formData.RegNumber)}
              />
            </InputFieldWrapper>
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-3 px-4 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700/50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-primary/90 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </form>
      </div>
    </ResponsiveDrawer>
  );
};

export default InviteCoopDrawer;
