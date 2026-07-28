import React, { useState } from "react";
import InputFieldWrapper from "@/components/orgadminSignup/InputFieldWrapper";
import SimpleSelect from "@/components/orgadminSignup/SimpleSelect";
import { SEVERITY_MAP } from "./CreateDiscrepancyForm";

const STATUS_OPTIONS = [
  {
    value: "open",
    label: "OPEN",
  },
  {
    value: "partially_resolved",
    label: "PARTIALLY RESOLVED",
  },
  {
    value: "resolved",
    label: "RESOLVED",
  },
];

const UpdateStatusForm = ({ discrepancy, onSubmit, onClose }) => {
  const [status, setStatus] = useState(discrepancy?.status || "open");

  const handleChange = (e) => {
    setStatus(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    onSubmit(status);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <InputFieldWrapper label="Title" htmlFor="title">
        <input
          id="title"
          value={discrepancy?.title || ""}
          disabled
          className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-slate-700 dark:text-gray-300"
        />
      </InputFieldWrapper>

      {/* Description */}
      <InputFieldWrapper label="Description" htmlFor="description">
        <textarea
          id="description"
          rows={8}
          value={discrepancy?.description || ""}
          disabled
          className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg resize-none dark:border-gray-600 dark:bg-slate-700 dark:text-gray-300"
        />
      </InputFieldWrapper>

      {/* Severity */}
      <InputFieldWrapper label="Severity" htmlFor="severity">
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${
            SEVERITY_MAP[discrepancy?.type]?.color
          }`}
        >
          {SEVERITY_MAP[discrepancy?.type]?.label}
        </span>
      </InputFieldWrapper>

      {/* Status */}
      <InputFieldWrapper label="Status" htmlFor="status" required>
        <SimpleSelect
          id="status"
          name="status"
          value={status}
          onChange={handleChange}
          options={STATUS_OPTIONS}
        />
      </InputFieldWrapper>

      <div className="flex justify-end gap-4 pt-4 border-t">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-slate-200 px-5 py-2.5 text-slate-800"
        >
          Cancel
        </button>

        <button
          type="submit"
          className="inline-flex min-w-[180px] items-center justify-center rounded-lg bg-primary px-5 py-2.5 font-medium text-white"
        >
          Update Status
        </button>
      </div>
    </form>
  );
};

export default UpdateStatusForm;
