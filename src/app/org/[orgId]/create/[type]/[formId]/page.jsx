"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";

import FormBuilderPage from "@/app/test2/page";

const extractMacros = (schema) => {
  const macros = [];

  schema?.phases?.forEach((phase) => {
    phase?.fields?.forEach((field) => {
      if (field.macroKey?.trim()) {
        macros.push({
          key: field.macroKey.trim(),
          value: "",
        });
      }
    });
  });

  return macros;
};

function incrementVersion(versionStr) {
  const currentYear = new Date().getFullYear();
  if (!versionStr) {
    return `${currentYear}.0`;
  }
  const parts = versionStr.split(".");
  const parsedYear = parseInt(parts[0], 10);
  if (parsedYear === currentYear) {
    const currentRev = parts[1] ? parseInt(parts[1], 10) : 0;
    const nextRev = isNaN(currentRev) ? 1 : currentRev + 1;
    return `${currentYear}.${nextRev}`;
  } else {
    return `${currentYear}.0`;
  }
}

export default function AuditFormBuilderPage() {
  const params = useParams();
  const router = useRouter();

  const { orgId, type, formId } = params;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [auditForm, setAuditForm] = useState(null);
  const [currentFormId, setCurrentFormId] = useState(formId);
  const [schema, setSchema] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (formId) {
      loadAuditForm(formId);
    }
  }, [formId]);

  const loadAuditForm = async (targetId = formId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/audit-forms/${targetId}`);
      const data = await response.json();

      if (response.status === 404 || !data.success || !data.auditForm) {
        // Form template not found -> fetch latest template for this org/type
        const latestRes = await fetch(
          `/api/audit-forms/latest?orgId=${orgId}&auditType=${type}`,
        );
        const latestData = await latestRes.json();

        let templateToUse = {
          title: `New ${type} Form`,
          description: "",
          settings: {
            collectEmail: false,
            allowMultipleSubmissions: true,
            confirmationMessage: "Your response has been recorded.",
          },
          phases: [
            {
              phaseId: `phase_${crypto.randomUUID()}`,
              title: "Section 1",
              description: "Enter the details",
              fields: [
                {
                  fieldId: crypto.randomUUID(),
                  componentType: "text",
                  label: "Untitled Question",
                  helperText: "",
                  required: false,
                  validation: {},
                  allowOther: false,
                },
              ],
            },
          ],
        };
        let newVersion = incrementVersion(null);

        if (latestData.success && latestData.auditForm) {
          const prevVersion = latestData.auditForm.version;
          newVersion = incrementVersion(prevVersion);
        }

        // Create new draft
        const createRes = await fetch("/api/audit-forms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            auditOrgId: orgId,
            auditType: type,
            template: templateToUse,
            version: newVersion,
          }),
        });
        const createData = await createRes.json();

        if (!createData.success || !createData.auditForm) {
          throw new Error(
            createData.error || "Failed to initialize draft form",
          );
        }

        const initializedForm = createData.auditForm;

        // Update the browser URL dynamically to match the newly generated ID
        setCurrentFormId(initializedForm.$id);
        window.history.replaceState(
          null,
          "",
          `/org/${orgId}/create/${type}/${initializedForm.$id}`,
        );

        setAuditForm(initializedForm);
        setSchema(templateToUse);
        return;
      }

      const form = data.auditForm;
      const parsedTemplate = {
        title: "Untitled Form",
        description: "",
        settings: {
          collectEmail: false,
          allowMultipleSubmissions: true,
          confirmationMessage: "Your response has been recorded.",
        },
        phases: [],
        ...(typeof form.template === "string"
          ? JSON.parse(form.template || "{}")
          : form.template),
      };

      setCurrentFormId(form.$id);
      setAuditForm(form);
      setSchema(parsedTemplate);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load audit form");
      toast.error(err.message || "Failed to load audit form");
    } finally {
      setLoading(false);
    }
  };

  const saveFormState = async (updatedSchema, status = "DRAFT") => {
    try {
      setSaving(true);

      const macros = extractMacros(updatedSchema);

      const response = await fetch(`/api/audit-forms/${currentFormId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template: updatedSchema,
          status,
          macros: JSON.stringify(macros)
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to save form");
      }

      if (data.auditForm) {
        setAuditForm(data.auditForm);
      }

      return data.auditForm;
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to save form");
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (updatedSchema) => {
    try {
      setSaving(true);
      console.log("macro view: ", updatedSchema);
      await saveFormState(updatedSchema, "Completed");
      toast.success("Form template submitted and published successfully.");
      // Redirect back to org dashboard
      router.push(`/dashboard?tab=form_builder`);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to publish form");
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = async () => {
    try {
      setSaving(true);
      const response = await fetch(`/api/audit-forms/${currentFormId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "Discarded",
        }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to discard form");
      }
      toast.success("Current draft template discarded.");

      // Generate a new UUID and restart the flow
      const newFormId = crypto.randomUUID();
      setSchema(null);
      setAuditForm(null);
      setCurrentFormId(newFormId);
      window.history.replaceState(
        null,
        "",
        `/org/${orgId}/create/${type}/${newFormId}`,
      );
      loadAuditForm(newFormId);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to discard form");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 text-slate-500 bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading Audit Builder...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6 bg-slate-50 dark:bg-slate-950">
        <div className="max-w-md p-6 text-center border border-red-200 rounded-2xl bg-red-50 dark:bg-red-950/20 dark:border-red-900/30">
          <h2 className="mb-2 text-lg font-bold text-red-600 dark:text-red-400">
            Failed to Load Form
          </h2>

          <p className="mb-4 text-sm text-red-500 dark:text-red-400/80">
            {error}
          </p>

          <button
            onClick={() => loadAuditForm(currentFormId)}
            className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-semibold transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!schema) {
    return null;
  }

  return (
    <FormBuilderPage
      auditForm={auditForm}
      initialSchema={schema}
      onSave={saveFormState}
      onPublish={handlePublish}
      onDiscard={handleDiscard}
      saving={saving}
      orgId={orgId}
      auditType={type}
      formId={currentFormId}
    />
  );
}
