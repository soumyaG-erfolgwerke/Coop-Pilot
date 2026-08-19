import { NextResponse } from "next/server";
import { createAuditForm, updateAuditForm } from "@/lib/auditFormService";

const checklistItems = [
  { id: "1.0", section: "Allgemein", number: "1.0", title: "Erklärung zur Prüfung- und Vollständigkeit", description: "Formular mit Fragenkatalog zur Prüfung nach §§ 53 ff GenG" },
  { id: "1.1", section: "Allgemein", number: "1.1", title: "Satzung", description: "aktuelle Satzung der Genossenschaft" },
  { id: "1.2", section: "Allgemein", number: "1.2", title: "Gewerbeanmeldung", description: "aktuelle Gewerbeanmeldung oder -ummeldung" },
  { id: "1.3", section: "Allgemein", number: "1.3", title: "Registerauszug", description: "aktueller Auszug aus dem Genossenschaftsregister" },
  { id: "1.4", section: "Allgemein", number: "1.4", title: "Immobilien und Unternehmensbeteiligungen", description: "Formular zu Immobilien sowie Unternehmensbeteiligungen > 25%" },
  { id: "1.5", section: "Allgemein", number: "1.5", title: "Mitgliederdarlehen", description: "Formular für Mitgliederdarlehen" },
  { id: "2.0", section: "Buchhaltung", number: "2.0", title: "Erklärung zur Führung der Bücher und Vermögenslage", description: "Formular mit Fragenkatalog zur Prüfung nach §§ 53 ff GenG" },
  { id: "2.1", section: "Buchhaltung", number: "2.1", title: "Jahresabschlüsse", description: "alle Jahresabchlüsse des Prüfzeitraums" },
  { id: "2.2", section: "Buchhaltung", number: "2.2", title: "Summen- & Saldenlisten", description: "passend zu den zuvor eingereichten Jahresabschlüssen" },
  { id: "2.3", section: "Buchhaltung", number: "2.3", title: "Sachkonten", description: "passend zu den zuvor eingereichten Jahresabschlüssen" },
  { id: "2.4", section: "Buchhaltung", number: "2.4", title: "Steuerbescheide", description: "passend zu den zuvor eingereichten Jahresabschlüssen" },
  { id: "2.5", section: "Buchhaltung", number: "2.5", title: "Offenlegung der Jahresabschlüsse", description: "Nachweis der Offenlegung der Jahresabschlüsse im Bundesanzeiger" },
  { id: "2.6", section: "Buchhaltung", number: "2.6", title: "aktuelle BWA", description: "maximal 3 Monate alt" },
  { id: "3.0", section: "Mitgliederliste", number: "3.0", title: "Erklärung zur Führung der Mitgliederliste", description: "Formular mit Fragenkatalog zur Prüfung nach §§ 53 ff GenG" },
  { id: "3.1", section: "Mitgliederliste", number: "3.1", title: "aktuelle Mitgliederliste", description: "mit Unterlagen der Zu- und Abgänge zum Zeitpunkt der Prüfung" },
  { id: "3.2", section: "Mitgliederliste", number: "3.2", title: "Mitgliederliste zum Jahresende", description: "mit Unterlagen der Zu- und Abgänge für jedes zu prüfende Jahr" },
  { id: "4.0", section: "Protokolle, Organe & Generalversammlung", number: "4.0", title: "Erklärung zu Organen, Geschäftsordnung und GV", description: "Formular mit Fragenkatalog zur Prüfung nach §§ 53 ff GenG" },
  { id: "4.1", section: "Protokolle, Organe & Generalversammlung", number: "4.1", title: "Geschäftsordnung GV, Vorstand und Aufsichtsrat", description: "GO ggf. Anlagen" },
  { id: "4.2", section: "Protokolle, Organe & Generalversammlung", number: "4.2", title: "Protokolle von Vorstands- und Aufsichtsratssitzungen", description: "Protokolle Vorstands- und Aufsichtsrats-Sitzungen ggf. Anlagen" },
  { id: "4.3", section: "Protokolle, Organe & Generalversammlung", number: "4.3", title: "Protokolle der Generalversammlungen im Prüfzeitraum", description: "Protokolle aller GV im Prüfzeitraum ggf. Anlagen" }
];

export async function POST(req) {
  try {
    const body = await req.json();
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json({ success: false, error: "Missing orgId" }, { status: 400 });
    }

    // Group the items into phases by section
    const groupedBySection = {};
    for (const item of checklistItems) {
      if (!groupedBySection[item.section]) {
        groupedBySection[item.section] = [];
      }
      groupedBySection[item.section].push(item);
    }

    const phases = [];
    let phaseIndex = 1;

    for (const section in groupedBySection) {
      const items = groupedBySection[section];
      
      const fields = items.map((item, index) => {
        return {
          fieldId: `field_${phaseIndex}_${index}`,
          componentType: "file",
          label: `${item.number} ${item.title}`,
          helperText: item.description,
          required: true,
          validation: {}
        };
      });

      phases.push({
        phaseId: `phase_${phaseIndex}`,
        title: section,
        description: `Please upload the required documents for ${section}`,
        fields: fields
      });
      phaseIndex++;
    }

    const templateData = {
      title: "Prüfung nach §§ 53 ff GenG",
      description: "Standard checklist for cooperative statutory audit.",
      settings: {
        collectEmail: false,
        allowMultipleSubmissions: true,
        confirmationMessage: "Your response has been recorded."
      },
      phases: phases
    };

    // Note: auditType strictly expects "full" or "simple" based on appwrite schema.
    const formDraft = await createAuditForm({
      auditOrgId: orgId,
      auditType: "full",
      template: templateData,
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
