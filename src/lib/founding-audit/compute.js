import { G2_DEFAULTS, G3_DEFAULTS } from "@/lib/founding-audit/formDefaults";

const generateCrossPhaseSummary = (formData, membersList) => {
  const g3Data = formData.G3Data || {};
  const g5Data = formData.G5Data || {};
  const g6Data = formData.G6Data || {};
  const membersDocuments = membersList?.documents || [];

  //! G4: All members must be GEEIGNET/BEDINGT_GEEIGNET
  const allMembersSuitable = !membersDocuments.some(
    (m) => m.suitabilityResult === "NICHT_GEEIGNET"
  );

  //! G5: riskIdentified must be NEIN & capitalPaidIn must be JA
  const capitalPaidIn = g5Data.capitalPaidIn === "JA" ? true : false;
  const noRiskIdentified = g5Data.riskIdentified === "NEIN" ? true : false;

  //! G6: purposeResult must be ERFUELLT
  const purposeResultErfuellt = g6Data.result === "ERFUELLT" ? true : false;

  //! G3: overallAssessment must be ERFUELLT
  const allStatutesCompliant = g3Data.overallAssessment === "ERFUELLT" ? true : false;

  return {
    allStatutesCompliant,
    allMembersSuitable,
    capitalPaidIn,
    noRiskIdentified,
    purposeResultErfuellt,
  };
};

const buildMasterState = async (auditDoc, membersList, formData) => {
  return {
    //* MASTER STATE METADATA
    auditId: auditDoc.$id,
    auditOrgId: auditDoc.auditOrgId ?? null,
    auditName: auditDoc.auditName ?? "",
    globalStatus: auditDoc.globalStatus ?? "IN_PROGRESS",

    //* SIDEBAR visual statuses object
    currentPhase: auditDoc.currentPhase ?? "G1",
    phaseStatuses: JSON.parse(auditDoc.phaseStatusJson) ?? {},

    //* PHASE DATA containers un-marshalled out of the primary string blob
    G1Data: formData.G1Data ?? {},
    G2Data: formData.G2Data?.items ? formData.G2Data : { items: G2_DEFAULTS },
    G3Data: formData.G3Data?.items
      ? formData.G3Data
      : {
          items: G3_DEFAULTS,
          overallAssessment: "",
          notes: "",
        },

    //* G4 - SPECIAL PHASE - Transforms members sub-collection documents into embedded array within masterState for easier access and manipulation across the app
    G4Data: {
      isAufsichtsratWaived: formData.G4Data?.isAufsichtsratWaived ?? false,
      members: membersList.documents.map((doc) => ({
        id: doc.$id,
        memberType: doc.memberType,
        title: doc.title ?? "",
        firstName: doc.firstName,
        lastName: doc.lastName,
        dateOfBirth: doc.dateOfBirth ?? null,
        address: doc.address ?? null,
        role: doc.role ?? null,
        shares: doc.shares ?? null,
        shareValueEur: doc.shareValueEur ?? null,
        capitalCommittedEur: doc.capitalCommittedEur ?? null,
        cvUrl: doc.cvUrl ?? null,
        suitabilityAssessment: doc.suitabilityAssessment ?? null,
        suitabilityResult: doc.suitabilityResult ?? null,
      })),
    },

    G5Data: formData.G5Data ?? {},
    G6Data: formData.G6Data ?? {},
    G7Data: formData.G7Data ?? {},

    //* G7 CROSS-PHASE SUMMARY - Computed on-the-fly from the current state of all phase data
    crossPhaseSummary: generateCrossPhaseSummary(formData, membersList),
  };
};

const generatePdfPayload = (
  auditDoc,
  auditOrgDetails,
  membersList,
  phaseData,
  payload,
) => {
  //! Hardcoded, legally prescribed formulations mandated under §11 Abs. 2 Nr. 3 GenG
  const LEGAL_CONCLUSION_STRINGS = {
    POSITIV:
      "Nach den persönlichen und wirtschaftlichen Verhältnissen, insbesondere der Vermögenslage der Genossenschaft, ist eine Gefährdung der Belange der Mitglieder oder der Gläubiger der Genossenschaft nicht zu besorgen.",
    BEDINGT_POSITIV:
      "Nach den persönlichen und wirtschaftlichen Verhältnissen ist eine Gefährdung der Belange der Mitglieder oder Gläubiger derzeit nicht zu besorgen, sofern folgende Auflagen erfüllt werden:",
    NEGATIV:
      "Nach den persönlichen und wirtschaftlichen Verhältnissen ist eine Gefährdung der Belange der Mitglieder oder der Gläubiger der Genossenschaft zu besorgen.",
  };

  const vorstand_aufsichtsrat = membersList.documents.filter(
    (m) => m.memberType === "VORSTAND" || m.memberType === "AUFSICHTSRAT",
  );
  const vorstand = membersList.documents.filter(
    (m) => m.memberType === "VORSTAND",
  );

  return {
    meta: {
      title: "GRÜNDUNGSGUTACHTEN gemäß §11 Abs. 2 Nr. 3 GenG",
      certificationDate: payload.gutachtenDate,
      auditorName: auditDoc.createdBy,
      auditOrgLetterheadUrl: auditOrgDetails.letterheadUrl,
      auditOrgLogoUrl: auditOrgDetails.logoUrl,
    },
    cooperativeDetails: {
      name: auditDoc.coopName || phaseData.G1Data?.coopName,
      proposedSeat: auditDoc.proposedCity || phaseData.G1Data?.proposedCity,
      sector: auditDoc.sector || phaseData.G1Data?.sector,
      contactPerson: phaseData.G1Data?.contactPersonName,
    },
    mandateDetails: {
      mandateDate: phaseData.G1Data?.mandateDate,
      mandateIssuedBy: phaseData.G1Data?.mandateIssuedBy,
      auditPeriodFrom: phaseData.G1Data?.auditPeriodFrom,
      auditPeriodTo: phaseData.G1Data?.auditPeriodTo,
    },
    documentsChecked: (phaseData.G2Data?.items || []).map((doc) => ({
      id: doc.itemId,
      verified: doc.checked,
    })),
    statutesAssessment: {
      overall: phaseData.G3Data?.overallAssessment,
      notes: phaseData.G3Data?.notes,
    },
    organsSuitability: vorstand_aufsichtsrat.map((m) => ({
      name: `${m.firstName} ${m.lastName}`,
      type: m.memberType,
      result: m.suitabilityResult,
      commentary: m.suitabilityAssessment,
    })),
    economicAssessment: phaseData.G5Data?.overallAssessment || "",
    purposeAssessment: phaseData.G6Data?.purposeStatement || "",
    conclusion: {
      legalText: LEGAL_CONCLUSION_STRINGS[payload.gutachtenResult],
      result: payload.gutachtenResult,
      reasoning: payload.reasoning,
      conditions:
        payload.gutachtenResult === "BEDINGT_POSITIV"
          ? payload.gutachtenConditions
          : null,
    },
    signature: {
      city: auditDoc.proposedCity,
      gutachtenSignedAt: payload.gutachtenDate,
      auditOrgName: auditOrgDetails.orgName,
      vorstandNames: vorstand.map((m) => `${m.firstName} ${m.lastName}`),
    },
  };
};

export { buildMasterState, generateCrossPhaseSummary, generatePdfPayload };