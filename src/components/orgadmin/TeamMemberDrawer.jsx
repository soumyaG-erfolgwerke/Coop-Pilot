"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Save, Lock } from "lucide-react";
import ResponsiveDrawer from "../shared/ResponsiveDrawer";
import InputFieldWrapper from "../orgadminSignup/InputFieldWrapper";
import TextInput from "../orgadminSignup/TextInput";
import SimpleSelect from "../orgadminSignup/SimpleSelect";
import { validatePassword } from "../../helpers/passwordValidator";

const ROLE_OPTIONS = [
  { value: "auditer", label: "Auditor" },
  { value: "aud_E", label: "Sub-Auditor" },
];

const STATUS_OPTIONS = [
  { value: "true", label: "Activated" },
  { value: "false", label: "Suspended" },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPLOYEE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-_]{2,31}$/;

const normalize = (value) => (value || "").trim().toLowerCase();

export default function TeamMemberDrawer({
  isOpen,
  onClose,
  defaultPassword = "",
  existingEmails = [],
  existingEmployeeIds = [],
  mode = "create",
  initialValues = null,
  onSubmit,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    empId: "",
    role: "auditor",
    password: defaultPassword,
    isActive: true,
  });
  const [errors, setErrors] = useState({});

  const emailSet = useMemo(
    () => new Set((existingEmails || []).map((value) => normalize(value))),
    [existingEmails]
  );
  const employeeIdSet = useMemo(
    () => new Set((existingEmployeeIds || []).map((value) => normalize(value))),
    [existingEmployeeIds]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setFormData({
      email: initialValues?.email || "",
      password: mode === "create" ? defaultPassword : "",
      name: initialValues?.name || "",
      empId: initialValues?.empId || "",
      role: initialValues?.role || "auditor",
      isActive:
        typeof initialValues?.isActive === "boolean" ? initialValues.isActive : true,
    });
    setErrors({});
  }, [defaultPassword, initialValues, isOpen, mode]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const validate = (data) => {
    const nextErrors = {};
    const email = data.email.trim();
    const password = data.password.trim();
    const name = data.name.trim();
    const empId = data.empId.trim();

    if (!email) nextErrors.email = "Email is required.";
    else if (!EMAIL_PATTERN.test(email)) nextErrors.email = "Enter a valid email address.";
    else if (emailSet.has(normalize(email))) nextErrors.email = "That email already exists.";

    if (mode === "create") {
      if (!password) nextErrors.password = "Password is required.";
      else {
        const passwordIssues = validatePassword(password);
        if (passwordIssues.length > 0) {
          nextErrors.password = `Password must include ${passwordIssues.join(", ")}.`;
        }
      }
    }

    if (!name) nextErrors.name = "Name is required.";
    else if (name.length < 2) nextErrors.name = "Name must be at least 2 characters.";

    if (!empId) nextErrors.empId = "Employee ID is required.";
    else if (!EMPLOYEE_ID_PATTERN.test(empId)) {
      nextErrors.empId = "Employee ID must be 3-32 characters and may use letters, numbers, hyphen, or underscore.";
    } else if (employeeIdSet.has(normalize(empId))) {
      nextErrors.empId = "That employee ID already exists.";
    }

    if (!ROLE_OPTIONS.some((option) => option.value === data.role)) {
      nextErrors.role = "Select a valid role.";
    }

    if (!["true", "false"].includes(String(data.isActive))) {
      nextErrors.isActive = "Select a valid status.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validate(formData);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit?.({
        email: formData.email.trim(),
        name: formData.name.trim(),
        empId: formData.empId.trim(),
        role: formData.role,
        isActive: formData.isActive,
        password: formData.password.trim(),
        id: initialValues?.id,
      });
      toast.success(mode === "create" ? "Team member added." : "Team member updated.");
      onClose?.();
    } catch (error) {
      toast.error(
        `Could not ${mode === "create" ? "add" : "update"} the team member right now.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Add team member" : "Edit team member"}
      description={
        mode === "create"
          ? "Create a new team member for the organization."
          : "Update the selected team member details."
      }
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="team-member-form"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className={`h-4 w-4 ${isSubmitting ? "animate-pulse" : ""}`} />
            {isSubmitting
              ? "Saving..."
              : mode === "create"
                ? "Save member"
                : "Update member"}
          </button>
        </div>
      }
    >
      <form id="team-member-form" className="space-y-5" onSubmit={handleSubmit} noValidate>
        <InputFieldWrapper label="Name" htmlFor="team-member-name" error={errors.name}>
          <TextInput
            id="team-member-name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={mode === "edit"}
            placeholder="Full name"
            error={errors.name}
          />
          {mode === "edit" && (
            <p className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Lock className="h-4 w-4" />
              Name is read-only and cannot be changed
            </p>
          )}
        </InputFieldWrapper>

        <InputFieldWrapper label="Email" htmlFor="team-member-email" error={errors.email}>
          <TextInput
            id="team-member-email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="member@example.com"
            disabled={mode === "edit"}
            error={errors.email}
          />
          {mode === "edit" && (
            <p className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Lock className="h-4 w-4" />
              Email is read-only and cannot be changed
            </p>
          )}
        </InputFieldWrapper>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputFieldWrapper label="Employee ID" htmlFor="team-member-employee-id" error={errors.empId}>
            <TextInput
              id="team-member-employee-id"
              name="empId"
              value={formData.empId}
              onChange={handleChange}
              placeholder="EMP-1003"
              error={errors.empId}
            />
          </InputFieldWrapper>

          <InputFieldWrapper label="Role" htmlFor="team-member-role" error={errors.role}>
            <SimpleSelect
              id="team-member-role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              options={ROLE_OPTIONS}
              error={errors.role}
            />
          </InputFieldWrapper>
        </div>

        <InputFieldWrapper label="Status" htmlFor="team-member-status" error={errors.isActive}>
          <SimpleSelect
            id="team-member-status"
            name="isActive"
            value={String(formData.isActive)}
            onChange={(event) => {
              const nextValue = event.target.value === "true";
              setFormData((prev) => ({ ...prev, isActive: nextValue }));
              setErrors((prev) => {
                if (!prev.isActive) return prev;
                const next = { ...prev };
                delete next.isActive;
                return next;
              });
            }}
            options={STATUS_OPTIONS}
            error={errors.isActive}
          />
        </InputFieldWrapper>

        {mode === "create" ? (
          <InputFieldWrapper
            label="Password"
            htmlFor="team-member-password"
            description="Prefilled from the page-level default password and editable here."
            error={errors.password}
          >
            <TextInput
              id="team-member-password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              error={errors.password}
            />
          </InputFieldWrapper>
        ) : null}
      </form>
    </ResponsiveDrawer>
  );
}
