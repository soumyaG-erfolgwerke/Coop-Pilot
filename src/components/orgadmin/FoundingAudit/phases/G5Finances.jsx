"use client";

import {
  FormField,
  RadioGroupField,
} from "@/components/orgadmin/FoundingAudit/FormFields";
import { G5ValidationSchema } from "@/lib/founding-audit/schema";
import { foundingAuditService } from "@/lib/foundingAuditService";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

const YES_NO_OPTIONS = [
  { label: "Yes", value: "JA" },
  { label: "No", value: "NEIN" },
];

const PhaseG5Finances = forwardRef(
  ({ data, onChange, isReadOnly, auditId }, ref) => {
    const [localErrors, setLocalErrors] = useState({});
    const [totalFoundingCapital, setTotalFoundingCapital] = useState(0);

    useEffect(() => {
      const loadFoundingCapital = async () => {
        if (!auditId) return;

        try {
          const members =
            await foundingAuditService.getOrgMembersByAuditId(auditId);

          const total = (members ?? []).reduce(
            (sum, member) => sum + Number(member?.capitalCommittedEur ?? 0),
            0,
          );

          setTotalFoundingCapital(total);
        } catch (error) {
          console.error("Failed to load founding capital:", error);
          setTotalFoundingCapital(0);
        }
      };

      loadFoundingCapital();
    }, [auditId]);

    useImperativeHandle(ref, () => ({
      validate() {
        const result = G5ValidationSchema.safeParse(data);

        if (result.success) {
          setLocalErrors({});
          return true;
        }

        const errorsMap = {};

        result.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            errorsMap[issue.path[0].toString()] = issue.message;
          }
        });

        setLocalErrors(errorsMap);
        return false;
      },
    }));

    const clearError = (key) => {
      setLocalErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    };

    const updateField = (key, value) => {
      const updated = {
        ...data,
        [key]: value,
      };

      updated.planYear1Result =
        Number(updated.planYear1Revenue || 0) -
        Number(updated.planYear1Costs || 0);

      updated.planYear2Result =
        Number(updated.planYear2Revenue || 0) -
        Number(updated.planYear2Costs || 0);

      updated.planYear3Result =
        Number(updated.planYear3Revenue || 0) -
        Number(updated.planYear3Costs || 0);

      onChange(updated);

      if (localErrors[key]) {
        clearError(key);
      }
    };

    const strategies = {
      text: (key) => ({
        value: data?.[key] ?? "",
        onChange: (e) => updateField(key, e.target.value),
      }),

      number: (key) => ({
        value: data?.[key] ?? "",
        onChange: (e) =>
          updateField(key, e.target.value === "" ? "" : Number(e.target.value)),
      }),

      radio: (key) => ({
        value: data?.[key] ?? "",
        onChange: (value) => updateField(key, value),
      }),
    };

    const bind = (key, type = "text") => ({
      disabled: isReadOnly,
      error: localErrors[key],
      ...strategies[type](key),
    });

    return (
      <div className="space-y-8 select-none">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">
            Phase G5: Financial Assessment & Economic Viability
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            Review founding capital adequacy, financial planning assumptions,
            liquidity outlook, and overall economic viability of the
            cooperative.
          </p>
        </div>

        {/* ====================================================== */}
        {/* Capital & Founding Finances */}
        {/* ====================================================== */}
        <div className="p-6 space-y-6 border bg-gray-50 border-gray-200/60 rounded-xl">
          <h3 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
            Capital & Founding Finances
          </h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
              label="Total Founding Capital (€)"
              disabled
              value={totalFoundingCapital.toLocaleString("de-DE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
              subtext="Automatically calculated from founding member capital commitments."
            />

            <RadioGroupField
              label="Capital Fully Paid In?"
              required={true}
              options={YES_NO_OPTIONS}
              {...bind("capitalPaidIn", "radio")}
            />
          </div>

          <FormField
            label="Capital Note"
            as="textarea"
            rows={3}
            placeholder="Provide remarks regarding paid-in capital, contribution timing, special conditions, etc."
            {...bind("capitalNote")}
          />

          <RadioGroupField
            label="Is Starting Capital Economically Sufficient?"
            options={YES_NO_OPTIONS}
            required={true}
            {...bind("capitalSufficient", "radio")}
          />
        </div>

        {/* ====================================================== */}
        {/* Financial Plan */}
        {/* ====================================================== */}
        <div className="pt-6 space-y-6 border-t border-gray-100">
          <h3 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
            Financial Plan Assessment (3-Year Projection)
          </h3>

          <div className="space-y-6">
            {[1, 2, 3].map((year) => (
              <div
                key={year}
                className="pb-6 border-b border-gray-100 last:border-none last:pb-0"
              >
                <div className="mb-4 text-sm font-semibold text-gray-700">
                  Year {year} Projection
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <FormField
                    label="Revenue (€)"
                    type="number"
                    required
                    {...bind(`planYear${year}Revenue`, "number")}
                  />

                  <FormField
                    label="Costs (€)"
                    type="number"
                    required
                    {...bind(`planYear${year}Costs`, "number")}
                  />

                  <FormField
                    label="Projected Result (€)"
                    required
                    disabled
                    value={data?.[`planYear${year}Result`] ?? 0}
                    subtext="Automatically calculated."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ====================================================== */}
        {/* Economic Viability */}
        {/* ====================================================== */}
        <div className="pt-6 space-y-6 border-t border-gray-100">
          <h3 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
            Economic Viability Assessment
          </h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <RadioGroupField
              label="Are projections plausible?"
              options={YES_NO_OPTIONS}
              required={true}
              {...bind("planPlausible", "radio")}
            />

            <RadioGroupField
              label="Adequate liquidity planning?"
              options={YES_NO_OPTIONS}
              required={true}
              {...bind("liquidityAdequate", "radio")}
            />

            <RadioGroupField
              label="Risk to members / creditors?"
              options={YES_NO_OPTIONS}
              required={true}
              {...bind("riskIdentified", "radio")}
            />
          </div>

          <FormField
            label="Overall Economic Assessment"
            as="textarea"
            required
            rows={5}
            placeholder="Provide a comprehensive assessment of economic sustainability, capital structure, liquidity, profitability outlook, and key risks..."
            {...bind("overallAssessment")}
          />
        </div>
      </div>
    );
  },
);

PhaseG5Finances.displayName = "PhaseG5Finances";

export { PhaseG5Finances };