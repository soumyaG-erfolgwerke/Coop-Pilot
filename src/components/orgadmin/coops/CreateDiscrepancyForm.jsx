import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import SimpleSelect from "@/components/orgadminSignup/SimpleSelect";
import InputFieldWrapper from "@/components/orgadminSignup/InputFieldWrapper";
import TextInput from "@/components/orgadminSignup/TextInput";

export const SEVERITY_OPTIONS = [
  {
    value: "notice",
    label: "HINWEIS",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    value: "obligate",
    label: "AUFLAGE",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  {
    value: "threat",
    label: "ANDROHUNG SONDERPRÜFUNG",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
  {
    value: "investigate",
    label: "SONDERPRÜFUNG",
    color: "bg-red-100 text-red-700 border-red-200",
  },
  {
    value: "ban",
    label: "VERBANDSAUSSCHLUSS",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
];

export const SEVERITY_MAP = SEVERITY_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item;
  return acc;
}, {});

const ROLE_SEVERITY_ACCESS = {
  org_admin: ["notice", "threat", "obligate", "investigate", "ban"],
  auditer: ["notice", "threat", "obligate", "investigate", "ban"],
  aud_E: ["notice", "threat"],
  aud_T: ["notice", "threat"],
};

const CreateDiscrepancyForm = ({ auditOrgId, coopId, onSubmit, onClose }) => {
  const { user } = useAuth();

  const userRole = user?.role;

  const filteredSeverityOptions = useMemo(() => {
    const allowedTypes = ROLE_SEVERITY_ACCESS[userRole] || ["LOW"];

    return SEVERITY_OPTIONS.filter((option) =>
      allowedTypes.includes(option.value),
    );
  }, [userRole]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (filteredSeverityOptions.length > 0 && !formData.type) {
      setFormData((prev) => ({
        ...prev,
        type: filteredSeverityOptions[0].value,
      }));
    }
  }, [filteredSeverityOptions]);

  const validateField = (field, value) => {
    let error = "";

    if (!value?.trim()) {
      error = "This field is required";
    }

    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));

    return !error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      validateField(name, value);
    }
  };

  const validateForm = () => {
    const titleValid = validateField("title", formData.title);

    const descriptionValid = validateField("description", formData.description);

    return titleValid && descriptionValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim(),
      type: formData.type,
      auditOrgId,
      coopId,
    });
  };

  const handleCancel = () => {
    setFormData({
      title: "",
      description: "",
      type: "",
    });

    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <InputFieldWrapper
        label="Title"
        htmlFor="title"
        error={errors.title}
        required
      >
        <TextInput
          id="title"
          name="title"
          placeholder="Enter discrepancy title"
          value={formData.title}
          onChange={handleChange}
          error={errors.title}
          onBlur={() => validateField("title", formData.title)}
        />
      </InputFieldWrapper>

      <InputFieldWrapper
        label="Description"
        htmlFor="description"
        error={errors.description}
        required
      >
        <textarea
          id="description"
          name="description"
          rows={5}
          placeholder="Describe the discrepancy..."
          value={formData.description}
          onChange={handleChange}
          onBlur={() => validateField("description", formData.description)}
          className={`w-full rounded-lg border bg-white dark:bg-slate-700 dark:text-gray-300 px-3 py-2 text-sm outline-none transition-all
            ${
              errors.description
                ? "border-red-500"
                : "border-gray-300 focus:border-green-500"
            }`}
        />
      </InputFieldWrapper>

      <InputFieldWrapper
        label="Severity"
        htmlFor="severity"
        error={errors.type}
        required
      >
        <SimpleSelect
          id="severity"
          name="type"
          value={formData.type}
          onChange={handleChange}
          options={filteredSeverityOptions}
          error={errors.type}
        />
      </InputFieldWrapper>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <button
          type="button"
          onClick={handleCancel}
          className="bg-slate-200 text-slate-800 px-5 py-2.5  rounded-lg"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex min-w-[180px] items-center justify-center rounded-lg px-5 py-2.5 font-medium bg-primary text-white"
        >
          Create Discrepancy
        </button>
      </div>
    </form>
  );
};

export default CreateDiscrepancyForm;
