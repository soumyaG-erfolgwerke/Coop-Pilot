import { z } from "zod";

const YES_NO = ["JA", "NEIN"];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const PHONE_REGEX = /^[+\d\s()-]+$/;

const parseDate = (value) => {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const isOnOrAfter = (earlier, later) => parseDate(later) >= parseDate(earlier);

const isNotFutureDate = (date) => parseDate(date) <= new Date();

const requiredString = (
  message = "This field is required.",
  maxLength = 255,
) => {
  const maxMsg = `This field cannot exceed ${maxLength} characters.`;
  return z.string().trim().min(1, message).max(maxLength, maxMsg);
};

const requiredPhoneNumber = (message = "Phone number is required.") =>
  requiredString(message).regex(
    PHONE_REGEX,
    "Please provide a valid phone number.",
  );

const requiredDate = (message = "Date is required.") =>
  requiredString(message).regex(DATE_REGEX, "Please provide a valid date.");

const addIssue = (ctx, field, message) => {
  ctx.addIssue({
    code: "custom",
    path: [field],
    message,
  });
};

const G1ValidationSchema = z
  .object({
    coopName: requiredString("Cooperative name is required."),
    proposedCity: requiredString("Proposed registered city is required."),
    sector: requiredString("Please specify the business industry sector."),
    contactPersonName: requiredString("Primary contact name is required."),
    contactPersonEmail: z.email("Please provide a valid email address."),
    contactPersonPhone: requiredPhoneNumber(),
    auditPeriodFrom: requiredDate("Audit evaluation start date is required."),
    auditPeriodTo: requiredDate("Audit evaluation end date is required."),

    // Core Mandate Form Fields
    mandateDate: requiredDate("Mandate date is required.").refine(
      isNotFutureDate,
      {
        message: "Mandate date cannot be in the future.",
      },
    ),
    mandateIssuedBy: requiredString(
      "Please specify who issued the audit mandate.",
    ),
    advisoryService: z.enum(YES_NO, {
      errorMap: () => ({
        message: "Please select an option regarding advisory services.",
      }),
    }),
    advisoryServiceDetails: z
      .string()
      .trim()
      .max(1000, "Advisory description cannot exceed 1000 characters.")
      .optional(),
    isConflictDeclared: z.literal(true, {
      errorMap: () => ({
        message:
          "The Conflict of Interest Declaration is legally mandatory to submit this phase.",
      }),
    }),
  })
  .superRefine((val, ctx) => {
    // Check that end date is after start date
    if (val.auditPeriodFrom && val.auditPeriodTo) {
      if (!isOnOrAfter(val.auditPeriodFrom, val.auditPeriodTo)) {
        addIssue(
          ctx,
          "auditPeriodTo",
          "Audit evaluation end date must be after the start date.",
        );
      }
    }
    // Conditional validation for advisory service details
    if (val.advisoryService === "JA" && !val.advisoryServiceDetails) {
      addIssue(
        ctx,
        "advisoryServiceDetails",
        "Please provide details about the advisory services received.",
      );
    }
  });

const G2ItemSchema = z
  .object({
    checked: z.boolean(),
    notApplicable: z.boolean(),
    fileUrls: z.array(z.url("Invalid file URL string detected.")),
    auditorNote: z.string().max(2000).optional().nullable(),
    isLocked: z.boolean().optional(),
  })
  .superRefine((item, ctx) => {
    // Rule 1: Mandated legislative records cannot be bypassed
    if (item.isLocked && item.notApplicable) {
      addIssue(
        ctx,
        "isLocked",
        `Document is legally mandatory and cannot be bypassed.`,
      );
    }

    // Rule 2: If an entry is applicable, it MUST be confirmed and contain an uploaded file pointer
    if (!item.notApplicable) {
      if (!item.checked) {
        addIssue(
          ctx,
          "checked",
          `Document must be confirmed as compliant or marked as not applicable.`,
        );
      }
      if (item.fileUrls.length === 0) {
        addIssue(
          ctx,
          "fileUrls",
          `At least one verified digital document attachment must be uploaded.`,
        );
      }
    }
  });

const G2ValidationSchema = z.object({
  items: z.array(G2ItemSchema).min(1, "Document collection matrix is empty."),
});

const G3ItemSchema = z
  .object({
    present: z.enum(["PRESENT", "MISSING"]),
    pageReference: z.string().max(50).optional().nullable(),
    missingNote: z.string().max(500).optional().nullable(),
  })
  .superRefine((item, ctx) => {
    if (
      item.present === "MISSING" &&
      (!item.missingNote || item.missingNote.trim() === "")
    ) {
      addIssue(
        ctx,
        "missingNote",
        `Please provide a note explaining the absence of this mandatory statutory element.`,
      );
    }
  });

const G3ValidationSchema = z.object({
  items: z.array(G3ItemSchema).min(13),
  overallAssessment: z.enum(["ERFUELLT", "BEDINGT", "NICHT_ERFUELLT"], {
    errorMap: () => ({
      message: "Please select an overall compliance assessment statement.",
    }),
  }),
  notes: z.string().max(2000).optional().nullable(),
});

const G4ItemSchema = z
  .object({
    memberType: z.enum(
      ["FOUNDING_MEMBER", "VORSTAND", "AUFSICHTSRAT", "BEVOLLMAECHTIGTER"],
      {
        errorMap: () => ({
          message: "Invalid or unmapped cooperative organ classification type.",
        }),
      },
    ),
    title: z.string().optional().nullable(),
    firstName: requiredString("First name is required."),
    lastName: requiredString("Last name is required."),
    dateOfBirth: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    role: z.string().optional().nullable(),
    shares: z.number().optional().nullable(),
    shareValueEur: z.number().optional().nullable(),
    capitalCommittedEur: z.number().optional().nullable(),
    cvUrl: z
      .url("Invalid CV document resource attachment link.")
      .optional()
      .nullable(),
    suitabilityAssessment: z.string().optional().nullable(),
    suitabilityResult: z
      .enum(["GEEIGNET", "BEDINGT_GEEIGNET", "NICHT_GEEIGNET"])
      .optional()
      .nullable(),
  })
  .superRefine((person, ctx) => {
    const isBoardOrSupervisory =
      person.memberType === "VORSTAND" || person.memberType === "AUFSICHTSRAT";

    // A. Strict Verification Parameters for Executive Directors and Supervisors
    if (isBoardOrSupervisory) {
      if (!person.dateOfBirth) {
        addIssue(
          ctx,
          "dateOfBirth",
          "Date of birth is mandatory for suitability checks.",
        );
      } else {
        // Legal Age Calculation Pass
        const ageDiff = Date.now() - new Date(person.dateOfBirth).getTime();
        const ageDate = new Date(ageDiff);
        const calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);

        if (calculatedAge < 18) {
          addIssue(ctx, "dateOfBirth", "Member must be at least 18 years old.");
        }
      }

      if (!person.cvUrl || person.cvUrl.trim() === "") {
        addIssue(
          ctx,
          "cvUrl",
          "A digital copy of the professional CV is required.",
        );
      }

      if (!person.suitabilityResult) {
        addIssue(
          ctx,
          "suitabilityResult",
          "Please log the suitability check final statement.",
        );
      }

      if (
        person.memberType === "VORSTAND" &&
        (!person.address || person.address.trim() === "")
      ) {
        addIssue(
          ctx,
          "address",
          "Full residential address is required for board executives.",
        );
      }
    }

    // B. Strict Verification Parameters for Shareholders
    if (person.memberType === "FOUNDING_MEMBER") {
      if (
        person.shares === null ||
        person.shares === undefined ||
        person.shares < 1
      ) {
        addIssue(ctx, "shares", "Number of shares must be at least 1.");
      }
      if (
        person.shareValueEur === null ||
        person.shareValueEur === undefined ||
        person.shareValueEur <= 0
      ) {
        addIssue(
          ctx,
          "shareValueEur",
          "Share nominal value must be a positive number.",
        );
      }
    }
  });

const G4ValidationSchema = z
  .object({
    isAufsichtsratWaived: z.boolean(),
    members: z.array(G4ItemSchema),
  })
  .superRefine((phase, ctx) => {
    const founders = phase.members.filter(
      (m) => m.memberType === "FOUNDING_MEMBER",
    );
    const board = phase.members.filter((m) => m.memberType === "VORSTAND");
    const supervisors = phase.members.filter(
      (m) => m.memberType === "AUFSICHTSRAT",
    );
    const representatives = phase.members.filter(
      (m) => m.memberType === "BEVOLLMAECHTIGTER",
    );

    //! Legal Constraint 1: Minimum founding member threshold (§4 GenG)
    if (founders.length < 3) {
      addIssue(
        ctx,
        "members",
        "German cooperative law requires a minimum of 3 founding members (§4 GenG).",
      );
    }

    //! Legal Constraint 2: Board sizing threshold metrics scaling loop (§24 Abs. 2 GenG)
    if (founders.length > 20) {
      if (board.length < 2) {
        addIssue(
          ctx,
          "members",
          "Cooperatives with more than 20 founding members must have at least 2 board executives (§24 Abs. 2 GenG).",
        );
      }
      if (phase.isAufsichtsratWaived) {
        addIssue(
          ctx,
          "isAufsichtsratWaived",
          "Cooperatives with more than 20 founding members cannot waive the supervisory board requirement (§36 GenG).",
        );
      }
    } else {
      if (board.length < 1) {
        addIssue(
          ctx,
          "members",
          "At least one Executive Board (Vorstand) member must be assigned to the organ list.",
        );
      }
    }

    //! Legal Constraint 3: Structural toggle validation enforcement path (§36 GenG)
    if (phase.isAufsichtsratWaived) {
      if (representatives.length < 1) {
        addIssue(
          ctx,
          "members",
          "A General Assembly Representative (Bevollmächtigter) must be assigned if the AR is waived.",
        );
      }
    } else {
      if (supervisors.length < 1) {
        addIssue(
          ctx,
          "members",
          "At least one Supervisory Board (Aufsichtsrat) member must be assigned if the supervisory board is active.",
        );
      }
    }

    //! Legal Constraint 4: Shareholder Cross-Check Guard Logic loop (§9 Abs. 2 GenG)
    // Maps a unique lowercase text key combo to detect matching records inside the founders pool
    const founderIdentityKeys = new Set(
      founders.map(
        (f) =>
          `${f.firstName.trim().toLowerCase()} ${f.lastName.trim().toLowerCase()}`,
      ),
    );

    phase.members.forEach((person, idx) => {
      if (person.memberType !== "FOUNDING_MEMBER") {
        const personKey = `${person.firstName.trim().toLowerCase()} ${person.lastName.trim().toLowerCase()}`;

        if (!founderIdentityKeys.has(personKey)) {
          ctx.addIssue({
            code: "custom",
            message: `${person.firstName} ${person.lastName} must be an active cooperative member shareholder.`,
            path: ["members", idx, "firstName"],
          });
        }
      }
    });
  });

const G5ValidationSchema = z.object({
  // Read-only calculated field from G4
  totalFoundingCapital: z.number().nonnegative().optional(),

  capitalPaidIn: z.enum(YES_NO, {
    errorMap: () => ({
      message: "Please indicate whether the founding capital is fully paid in.",
    }),
  }),

  capitalNote: z
    .string()
    .trim()
    .max(1000, "Capital note cannot exceed 1000 characters.")
    .optional(),

  capitalSufficient: z.enum(YES_NO, {
    errorMap: () => ({
      message:
        "Please indicate whether the starting capital is economically sufficient.",
    }),
  }),

  planYear1Revenue: z
    .number({
      required_error: "Expected revenue for Year 1 is required.",
    })
    .min(0, "Revenue cannot be negative."),

  planYear1Costs: z
    .number({
      required_error: "Expected costs for Year 1 are required.",
    })
    .min(0, "Costs cannot be negative."),

  // Calculated field
  planYear1Result: z.number().optional(),

  planYear2Revenue: z
    .number({
      required_error: "Expected revenue for Year 2 is required.",
    })
    .min(0, "Revenue cannot be negative."),

  planYear2Costs: z
    .number({
      required_error: "Expected costs for Year 2 are required.",
    })
    .min(0, "Costs cannot be negative."),

  // Calculated field
  planYear2Result: z.number().optional(),

  planYear3Revenue: z
    .number({
      required_error: "Expected revenue for Year 3 is required.",
    })
    .min(0, "Revenue cannot be negative."),

  planYear3Costs: z
    .number({
      required_error: "Expected costs for Year 3 are required.",
    })
    .min(0, "Costs cannot be negative."),

  // Calculated field
  planYear3Result: z.number().optional(),

  planPlausible: z.enum(YES_NO, {
    errorMap: () => ({
      message:
        "Please indicate whether the financial projections are plausible.",
    }),
  }),

  liquidityAdequate: z.enum(YES_NO, {
    errorMap: () => ({
      message: "Please indicate whether a sufficient liquidity plan exists.",
    }),
  }),

  riskIdentified: z.enum(YES_NO, {
    errorMap: () => ({
      message: "Please indicate whether a risk to members or creditors exists.",
    }),
  }),

  overallAssessment: requiredString(
    "Overall economic assessment is required.",
    3000,
  ),
});

const G6ValidationSchema = z
  .object({
    purposeDefined: z.enum(YES_NO, {
      errorMap: () => ({
        message: "Please evaluate if the purpose is clearly defined.",
      }),
    }),
    purposePromotesMembers: z.enum(YES_NO, {
      errorMap: () => ({
        message: "Please evaluate if the purpose promotes members.",
      }),
    }),
    notInvestmentVehicle: z.enum(YES_NO, {
      errorMap: () => ({
        message: "Please evaluate the investor return-on-investment status.",
      }),
    }),
    purposePlausible: z.enum(YES_NO, {
      errorMap: () => ({
        message: "Please evaluate purpose business model plausibility.",
      }),
    }),
    cooperationRecognizable: z.enum(YES_NO, {
      errorMap: () => ({
        message: "Please evaluate member cooperation structures.",
      }),
    }),
    notTaxInstrument: z.enum(YES_NO, {
      errorMap: () => ({
        message: "Please evaluate tax shield indication markers.",
      }),
    }),
    purposeStatement: z
      .string()
      .min(
        10,
        "The purpose statement assessment must be at least 10 characters long.",
      )
      .max(
        3000,
        "The purpose statement assessment text cannot exceed 3000 characters.",
      ),
    result: z.enum(["ERFUELLT", "BEDINGT", "NICHT_ERFUELLT"], {
      errorMap: () => ({
        message: "Please select the overall cooperative purpose check result.",
      }),
    }),
  })
  .superRefine((data, ctx) => {
    // Hard Legal Guard: If the cooperative is flagged as a pure investment object (notInvestmentVehicle === "NEIN"),
    // or if overall purpose check is failed, the final result must evaluate to NICHT_ERFUELLT
    if (
      (data.notInvestmentVehicle === "NEIN" ||
        data.result === "NICHT_ERFUELLT") &&
      data.result !== "NICHT_ERFUELLT"
    ) {
      addIssue(
        ctx,
        "result",
        "Legal Conflict: Overall result must be 'Nicht erfüllt' (NICHT_ERFUELLT) due to core criteria failures.",
      );
    }
  });

const G7ValidationSchema = z
  .object({
    gutachtenResult: z.enum(["POSITIV", "BEDINGT_POSITIV", "NEGATIV"], {
      errorMap: () => ({
        message: "Please select the definitive legal audit conclusion result.",
      }),
    }),
    gutachtenConditions: z.string().max(3000).optional().nullable(),
    reasoning: z
      .string()
      .min(10, "Detailed legal reasoning is required (minimum 10 characters).")
      .max(5000, "Reasoning text cannot exceed 5000 characters."),
    gutachtenDate: z
      .string()
      .min(1, "The official certificate date is required."),
    gutachtenUrl: z.url().optional().nullable(),
    gutachtenSignedAt: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Clear Legal Dependency Rule 1: If result is conditional, specific obligations must be typed in
    if (
      data.gutachtenResult === "BEDINGT_POSITIV" &&
      (!data.gutachtenConditions || data.gutachtenConditions.trim() === "")
    ) {
      addIssue(
        ctx,
        "gutachtenConditions",
        "For a conditional positive result, you must enter the specific conditions (Auflagen).",
      );
    }
  });

export {
  G1ValidationSchema,
  G2ValidationSchema,
  G3ValidationSchema,
  G4ItemSchema,
  G4ValidationSchema,
  G5ValidationSchema,
  G6ValidationSchema,
  G7ValidationSchema,
};
