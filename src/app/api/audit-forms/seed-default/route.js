import { NextResponse } from "next/server";
import { createAuditForm, updateAuditForm } from "@/lib/auditFormService";

function uniqueId() {
  return Math.random().toString(36).substring(2, 11);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json({ success: false, error: "Missing orgId" }, { status: 400 });
    }

    const yesNoOptions = [
      { id: uniqueId(), label: "Yes", value: "yes" },
      { id: uniqueId(), label: "No", value: "no" }
    ];

    const defaultSchema = {
      title: "Prüfung nach §§ 53 ff GenG (Complete)",
      description: "Standard checklist and full requirements for cooperative statutory audit.",
      settings: {
        collectEmail: false,
        allowMultipleSubmissions: true,
        confirmationMessage: "Your audit submission has been recorded."
      },
      phases: [
        // PHASE 1: Audit Requirements
        {
          phaseId: uniqueId(),
          title: "1. Prüfungs- und Anwendungsvoraussetzungen",
          description: "Basic audit requirements and financial compliance info.",
          fields: [
            { fieldId: uniqueId(), componentType: "text", label: "Cooperative Name", required: true },
            { fieldId: uniqueId(), componentType: "text", label: "Legal Representative", required: true },
            { fieldId: uniqueId(), componentType: "text", label: "Audit Period", required: true },
            { fieldId: uniqueId(), componentType: "number", label: "Total Assets (Year 1)", required: true },
            { fieldId: uniqueId(), componentType: "number", label: "Total Assets (Year 2)", required: true },
            { fieldId: uniqueId(), componentType: "number", label: "Sales Revenue (Year 1)", required: true },
            { fieldId: uniqueId(), componentType: "number", label: "Sales Revenue (Year 2)", required: true },
            { fieldId: uniqueId(), componentType: "multiple_choice", label: "Has additional contributions?", required: true, options: yesNoOptions },
            { fieldId: uniqueId(), componentType: "multiple_choice", label: "Has operational liability insurance?", required: true, options: yesNoOptions },
            { fieldId: uniqueId(), componentType: "multiple_choice", label: "Is IT hardware monitored?", required: true, options: yesNoOptions },
            { fieldId: uniqueId(), componentType: "multiple_choice", label: "Are you GDPR compliant?", required: true, options: yesNoOptions }
          ]
        },
        // PHASE 2: Statutory Audit 
        {
          phaseId: uniqueId(),
          title: "2. Statutory Audit Information",
          description: "Information about members, board, and minutes.",
          fields: [
            { fieldId: uniqueId(), componentType: "text", label: "Club Name", required: true },
            { fieldId: uniqueId(), componentType: "text", label: "Registration Number", required: true },
            { fieldId: uniqueId(), componentType: "number", label: "Member Count", required: true },
            { fieldId: uniqueId(), componentType: "number", label: "New Member Count", required: true },
            { fieldId: uniqueId(), componentType: "number", label: "Termination Count", required: true },
            { fieldId: uniqueId(), componentType: "multiple_choice", label: "Is membership list maintained?", required: false, options: yesNoOptions },
            { fieldId: uniqueId(), componentType: "multiple_choice", label: "Does cooperative have a supervisory board?", required: false, options: yesNoOptions },
            { fieldId: uniqueId(), componentType: "text", label: "Board Chairman Name", required: false },
            { fieldId: uniqueId(), componentType: "text", label: "Supervisory Board Chairman", required: false },
            { fieldId: uniqueId(), componentType: "multiple_choice", label: "Has General Assembly occurred?", required: false, options: yesNoOptions }
          ]
        },
        // PHASE 3: Books Management
        {
          phaseId: uniqueId(),
          title: "3. Books Management",
          description: "Internal controls, risks, and tax details.",
          fields: [
            { fieldId: uniqueId(), componentType: "multiple_choice", label: "Are internal controls present?", required: true, options: yesNoOptions },
            { fieldId: uniqueId(), componentType: "multiple_choice", label: "Are there control deficiencies?", required: true, options: [
                { id: uniqueId(), label: "None", value: "none" },
                { id: uniqueId(), label: "They exist", value: "exist" }
            ]},
            { fieldId: uniqueId(), componentType: "multiple_choice", label: "Are business transactions compliant?", required: true, options: yesNoOptions },
            { fieldId: uniqueId(), componentType: "multiple_choice", label: "Bookkeeping Type", required: true, options: [
                { id: uniqueId(), label: "Internal", value: "internal" },
                { id: uniqueId(), label: "External", value: "external" }
            ]},
            { fieldId: uniqueId(), componentType: "text", label: "Tax Declaration Submitted Until", required: false },
            { fieldId: uniqueId(), componentType: "multiple_choice", label: "Has Tax Audits?", required: false, options: yesNoOptions }
          ]
        },
        // PHASE 4: Document Checklist
        {
          phaseId: uniqueId(),
          title: "4. Document Checklist",
          description: "Please upload the required documents for the audit.",
          fields: [
            { fieldId: uniqueId(), componentType: "file", label: "Erklärung zur Prüfung- und Vollständigkeit (1.0)", required: false },
            { fieldId: uniqueId(), componentType: "file", label: "Satzung (1.1)", required: false },
            { fieldId: uniqueId(), componentType: "file", label: "Gewerbeanmeldung (1.2)", required: false },
            { fieldId: uniqueId(), componentType: "file", label: "Registerauszug (1.3)", required: false },
            { fieldId: uniqueId(), componentType: "file", label: "Immobilien und Unternehmensbeteiligungen (1.4)", required: false },
            { fieldId: uniqueId(), componentType: "file", label: "Mitgliederdarlehen (1.5)", required: false },
            { fieldId: uniqueId(), componentType: "file", label: "Erklärung zur Führung der Bücher (2.0)", required: false },
            { fieldId: uniqueId(), componentType: "file", label: "Jahresabschlüsse (2.1)", required: false },
            { fieldId: uniqueId(), componentType: "file", label: "Summen- & Saldenlisten (2.2)", required: false },
            { fieldId: uniqueId(), componentType: "file", label: "Sachkonten (2.3)", required: false },
            { fieldId: uniqueId(), componentType: "file", label: "Steuerbescheide (2.4)", required: false },
            { fieldId: uniqueId(), componentType: "file", label: "Offenlegung der Jahresabschlüsse (2.5)", required: false },
            { fieldId: uniqueId(), componentType: "file", label: "Aktuelle BWA (2.6)", required: false },
            { fieldId: uniqueId(), componentType: "file", label: "Erklärung zur Führung der Mitgliederliste (3.0)", required: false },
            { fieldId: uniqueId(), componentType: "file", label: "Aktuelle Mitgliederliste (3.1)", required: false },
            { fieldId: uniqueId(), componentType: "file", label: "Mitgliederliste zum Jahresende (3.2)", required: false },
            { fieldId: uniqueId(), componentType: "file", label: "Erklärung zu Organen, Geschäftsordnung und GV (4.0)", required: false },
            { fieldId: uniqueId(), componentType: "file", label: "Geschäftsordnung GV, Vorstand und Aufsichtsrat (4.1)", required: false },
            { fieldId: uniqueId(), componentType: "file", label: "Protokolle von Vorstands- und Aufsichtsratssitzungen (4.2)", required: false },
            { fieldId: uniqueId(), componentType: "file", label: "Protokolle der Generalversammlungen (4.3)", required: false }
          ]
        }
      ]
    };

    const formDraft = await createAuditForm({
      auditOrgId: orgId,
      auditType: "full",
      template: defaultSchema,
      version: new Date().getFullYear().toString() + ".0",
    });

    const completedForm = await updateAuditForm(formDraft.$id, {
      status: "Completed",
    });

    return NextResponse.json({ success: true, form: completedForm });
  } catch (error) {
    console.error("Error seeding default template:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
