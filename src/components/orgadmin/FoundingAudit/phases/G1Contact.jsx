"use client";

import {
  CheckboxField,
  FormField,
  RadioGroupField,
} from "@/components/orgadmin/FoundingAudit/FormFields";
import { G1ValidationSchema } from "@/lib/founding-audit/schema";
import { forwardRef, useImperativeHandle, useState } from "react";

const PhaseG1Contact = forwardRef(({ data, onChange, isReadOnly }, ref) => {
  const [localErrors, setLocalErrors] = useState({});

  useImperativeHandle(ref, () => ({
    validate() {
      const result = G1ValidationSchema.safeParse(data);
      if (result.success) {
        setLocalErrors({});
        return true;
      }
      const errorsMap = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) errorsMap[issue.path[0].toString()] = issue.message;
      });
      setLocalErrors(errorsMap);
      return false;
    },
  }));

  const clearError = (key) =>
    setLocalErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

  const updateField = (key, value) => {
    onChange({ ...data, [key]: value });
    if (localErrors[key]) clearError(key);
  };

  const strategies = {
    text: (key) => ({
      value: data[key] ?? "",
      onChange: (e) => updateField(key, e.target.value),
    }),
    radio: (key) => ({
      value: data[key] ?? "",
      onChange: (val) => updateField(key, val),
    }),
    checkbox: (key) => ({
      checked: !!data[key],
      onChange: (val) => updateField(key, val),
    }),
  };

  const bind = (key, type = "text") => ({
    disabled: isReadOnly,
    error: localErrors[key],
    ...strategies[type](key),
  });

  return (
    <div className="space-y-8 select-none">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-gray-900">
          Phase G1: Audit Mandate & Contact
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Verify initiation records, confirm mandate parameters, and complete
          the mandatory conflict declaration.
        </p>
      </div>

      {/* Section 1: Upgraded Form Fields */}
      <div className="p-6 space-y-6 border bg-gray-50 border-gray-200/60 rounded-xl">
        <h3 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
          Cooperative Setup Parameters
        </h3>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            label="Proposed Cooperative Name"
            type="text"
            required
            {...bind("coopName")}
          />
          <FormField
            label="Proposed Registered Seat"
            type="text"
            required
            {...bind("proposedCity")}
          />
          <FormField
            label="Core Industry Sector"
            type="text"
            required
            {...bind("sector")}
          />

          <div className="grid w-full grid-cols-2 gap-4">
            <FormField
              label="Evaluation From"
              type="date"
              required
              {...bind("auditPeriodFrom")}
            />
            <FormField
              label="Evaluation To"
              type="date"
              required
              {...bind("auditPeriodTo")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 pt-6 border-t border-gray-200/80 md:grid-cols-3">
          <FormField
            label="Contact Person Name"
            type="text"
            required
            {...bind("contactPersonName")}
          />
          <FormField
            label="Contact Email Address"
            type="email"
            required
            {...bind("contactPersonEmail")}
          />
          <FormField
            label="Contact Phone Number"
            type="text"
            required
            {...bind("contactPersonPhone")}
          />
        </div>
      </div>

      {/* Section 2: Core Mandate Details */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FormField
          label="Date of Mandate"
          type="date"
          required
          {...bind("mandateDate")}
        />
        <FormField
          label="Mandate Issued By"
          type="text"
          required
          placeholder="e.g., Klaus Müller, on behalf of XYZ Auditing GmbH"
          {...bind("mandateIssuedBy")}
        />
      </div>

      {/* Section 3: External Advisory Verification */}
      <div className="pt-6 space-y-4 border-t border-gray-100">
        <RadioGroupField
          label="Has the founding group utilized advisory services from this audit organization? *"
          subText="Relevant context parameter used to evaluate compliance thresholds under §55 GenG rules."
          options={[
            { label: "Yes (Ja)", value: "JA" },
            { label: "No (Nein)", value: "NEIN" },
          ]}
          disabled={isReadOnly}
          {...bind("advisoryService", "radio")}
        />

        {data.advisoryService === "JA" && (
          <div className="animate-fadeIn">
            <FormField
              label="Description of Provided Advisory Services"
              as="textarea"
              required
              rows={3}
              placeholder="Provide a brief summary detailing historical statutory consultations or architectural setups..."
              {...bind("advisoryServiceDetails")}
            />
          </div>
        )}
      </div>

      {/* Section 4: Hard Legal Boundary Checkbox */}
      <CheckboxField
        label="Conflict of Interest Declaration (§55 GenG) *"
        subtext="I hereby formally declare that no active member assigned to this audit team maintains any personal, financial, or commercial conflicting interest relative to the cooperative entity currently in formation."
        {...bind("isConflictDeclared", "checkbox")}
      />
    </div>
  );
});

PhaseG1Contact.displayName = "PhaseG1Contact";
export { PhaseG1Contact };
