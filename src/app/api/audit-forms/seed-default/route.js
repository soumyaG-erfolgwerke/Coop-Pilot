import { NextResponse } from "next/server";
import { getDb } from "@/lib/appwrite";
import { ID } from "node-appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID_AUDIT_FORMS = "683f2302002cd49b3864"; 
const COLLECTION_ID_CURRENT_AUDIT_FORM = "683f2081001dfa70dc1c";

export async function POST(req) {
  try {
    const { orgId } = await req.json();
    if (!orgId) {
      return NextResponse.json({ success: false, error: "orgId required" }, { status: 400 });
    }

    const { databases } = await getDb();

    // Generate unique options repeatedly used
    const yesNoOptions = [
      { id: ID.unique(), label: "Yes", value: "yes" },
      { id: ID.unique(), label: "No", value: "no" }
    ];

    // The complete structural mapping of all 4 easycoop-auditway-main schemas
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
          phaseId: ID.unique(),
          title: "1. Prüfungs- und Anwendungsvoraussetzungen",
          description: "Basic audit requirements and financial compliance info.",
          fields: [
            { fieldId: ID.unique(), componentType: "text", label: "Cooperative Name", required: true },
            { fieldId: ID.unique(), componentType: "text", label: "Legal Representative", required: true },
            { fieldId: ID.unique(), componentType: "text", label: "Audit Period", required: true },
            { fieldId: ID.unique(), componentType: "number", label: "Total Assets (Year 1)", required: true },
            { fieldId: ID.unique(), componentType: "number", label: "Total Assets (Year 2)", required: true },
            { fieldId: ID.unique(), componentType: "number", label: "Sales Revenue (Year 1)", required: true },
            { fieldId: ID.unique(), componentType: "number", label: "Sales Revenue (Year 2)", required: true },
            { fieldId: ID.unique(), componentType: "multiple_choice", label: "Has additional contributions?", required: true, options: yesNoOptions },
            { fieldId: ID.unique(), componentType: "multiple_choice", label: "Has operational liability insurance?", required: true, options: yesNoOptions },
            { fieldId: ID.unique(), componentType: "multiple_choice", label: "Is IT hardware monitored?", required: true, options: yesNoOptions },
            { fieldId: ID.unique(), componentType: "multiple_choice", label: "Are you GDPR compliant?", required: true, options: yesNoOptions }
          ]
        },
        // PHASE 2: Statutory Audit 
        {
          phaseId: ID.unique(),
          title: "2. Statutory Audit Information",
          description: "Information about members, board, and minutes.",
          fields: [
            { fieldId: ID.unique(), componentType: "text", label: "Club Name", required: true },
            { fieldId: ID.unique(), componentType: "text", label: "Registration Number", required: true },
            { fieldId: ID.unique(), componentType: "number", label: "Member Count", required: true },
            { fieldId: ID.unique(), componentType: "number", label: "New Member Count", required: true },
            { fieldId: ID.unique(), componentType: "number", label: "Termination Count", required: true },
            { fieldId: ID.unique(), componentType: "multiple_choice", label: "Is membership list maintained?", required: false, options: yesNoOptions },
            { fieldId: ID.unique(), componentType: "multiple_choice", label: "Does cooperative have a supervisory board?", required: false, options: yesNoOptions },
            { fieldId: ID.unique(), componentType: "text", label: "Board Chairman Name", required: false },
            { fieldId: ID.unique(), componentType: "text", label: "Supervisory Board Chairman", required: false },
            { fieldId: ID.unique(), componentType: "multiple_choice", label: "Has General Assembly occurred?", required: false, options: yesNoOptions }
          ]
        },
        // PHASE 3: Books Management
        {
          phaseId: ID.unique(),
          title: "3. Books Management",
          description: "Internal controls, risks, and tax details.",
          fields: [
            { fieldId: ID.unique(), componentType: "multiple_choice", label: "Are internal controls present?", required: true, options: yesNoOptions },
            { fieldId: ID.unique(), componentType: "multiple_choice", label: "Are there control deficiencies?", required: true, options: [
                { id: ID.unique(), label: "None", value: "none" },
                { id: ID.unique(), label: "They exist", value: "exist" }
            ]},
            { fieldId: ID.unique(), componentType: "multiple_choice", label: "Are business transactions compliant?", required: true, options: yesNoOptions },
            { fieldId: ID.unique(), componentType: "multiple_choice", label: "Bookkeeping Type", required: true, options: [
                { id: ID.unique(), label: "Internal", value: "internal" },
                { id: ID.unique(), label: "External", value: "external" }
            ]},
            { fieldId: ID.unique(), componentType: "text", label: "Tax Declaration Submitted Until", required: false },
            { fieldId: ID.unique(), componentType: "multiple_choice", label: "Has Tax Audits?", required: false, options: yesNoOptions }
          ]
        },
        // PHASE 4: Document Checklist
        {
          phaseId: ID.unique(),
          title: "4. Document Checklist",
          description: "Please upload the required documents for the audit.",
          fields: [
            { fieldId: ID.unique(), componentType: "file", label: "Erklärung zur Prüfung- und Vollständigkeit (1.0)", required: false },
            { fieldId: ID.unique(), componentType: "file", label: "Satzung (1.1)", required: false },
            { fieldId: ID.unique(), componentType: "file", label: "Gewerbeanmeldung (1.2)", required: false },
            { fieldId: ID.unique(), componentType: "file", label: "Registerauszug (1.3)", required: false },
            { fieldId: ID.unique(), componentType: "file", label: "Immobilien und Unternehmensbeteiligungen (1.4)", required: false },
            { fieldId: ID.unique(), componentType: "file", label: "Mitgliederdarlehen (1.5)", required: false },
            { fieldId: ID.unique(), componentType: "file", label: "Erklärung zur Führung der Bücher (2.0)", required: false },
            { fieldId: ID.unique(), componentType: "file", label: "Jahresabschlüsse (2.1)", required: false },
            { fieldId: ID.unique(), componentType: "file", label: "Summen- & Saldenlisten (2.2)", required: false },
            { fieldId: ID.unique(), componentType: "file", label: "Sachkonten (2.3)", required: false },
            { fieldId: ID.unique(), componentType: "file", label: "Steuerbescheide (2.4)", required: false },
            { fieldId: ID.unique(), componentType: "file", label: "Offenlegung der Jahresabschlüsse (2.5)", required: false },
            { fieldId: ID.unique(), componentType: "file", label: "Aktuelle BWA (2.6)", required: false },
            { fieldId: ID.unique(), componentType: "file", label: "Erklärung zur Führung der Mitgliederliste (3.0)", required: false },
            { fieldId: ID.unique(), componentType: "file", label: "Aktuelle Mitgliederliste (3.1)", required: false },
            { fieldId: ID.unique(), componentType: "file", label: "Mitgliederliste zum Jahresende (3.2)", required: false },
            { fieldId: ID.unique(), componentType: "file", label: "Erklärung zu Organen, Geschäftsordnung und GV (4.0)", required: false },
            { fieldId: ID.unique(), componentType: "file", label: "Geschäftsordnung GV, Vorstand und Aufsichtsrat (4.1)", required: false },
            { fieldId: ID.unique(), componentType: "file", label: "Protokolle von Vorstands- und Aufsichtsratssitzungen (4.2)", required: false },
            { fieldId: ID.unique(), componentType: "file", label: "Protokolle der Generalversammlungen (4.3)", required: false }
          ]
        }
      ]
    };

    // 1. Create a DRAFT audit form document
    const draftFormDoc = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_FORMS,
      ID.unique(),
      {
        orgId,
        title: "Prüfung nach §§ 53 ff GenG (Complete)",
        description: "Generated from default template with all requirements.",
        schema: JSON.stringify(defaultSchema),
        version: 1,
        auditType: "full",
        status: "Draft",
      }
    );

    // 2. Set it to Completed
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID_AUDIT_FORMS,
      draftFormDoc.$id,
      { status: "Completed" }
    );

    // 3. Mark it as the current active form
    await databases.createDocument(
      DATABASE_ID,
      COLLECTION_ID_CURRENT_AUDIT_FORM,
      ID.unique(),
      {
        orgId,
        formId: draftFormDoc.$id,
        activatedAt: new Date().toISOString(),
      }
    );

    return NextResponse.json({ success: true, draftFormDoc });
  } catch (error) {
    console.error("Default seed failed:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
