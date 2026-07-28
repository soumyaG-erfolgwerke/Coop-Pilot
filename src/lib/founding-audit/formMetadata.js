const G2_METADATA = [
  {
    itemId: "G2.1",
    nameEn: "Draft Statutes (Latest Version)",
    intent: "Satzungsentwurf: Must include all mandatory elements per §6 GenG",
    isLocked: true,
  },
  {
    itemId: "G2.2",
    nameEn: "Founding Protocol Assembly Minutes",
    intent:
      "Gründungsversammlung: Must include: date,location, all founding members present,resolution to found the cooperative, adoption of statutes, election of Vorstand and AR.",
    isLocked: true,
  },
  {
    itemId: "G2.3",
    nameEn: "Complete List of Founding Members",
    intent:
      "Mitgliederliste der Gründungsmitglieder: Must include Name, address, number of shares, share value for each founding member. Min. 3 members required by law.",
    isLocked: true,
  },
  {
    itemId: "G2.4",
    nameEn: "3-Year Business Plan & Financial Forecast",
    intent:
      "Wirtschaftsplan: Must include 3-year revenue/cost projection, share value for each founding member. Min. 3 members required by law.",
    isLocked: true,
  },
  {
    itemId: "G2.5",
    nameEn: "CVs of Board Members",
    intent:
      "Lebensläufe der Vorstandmitglieder: Required for personality suitability assessment under §55 GenG.",
    isLocked: true,
  },
  {
    itemId: "G2.6",
    nameEn: "CVs of Supervisory Board Members",
    intent:
      "Lebensläufe der Aufsichtsratsmitglieder: Only required if AR is formed. May be omitted for small coops with < 20 members where GV representative replaces AR.",
    isLocked: false,
  },
  {
    itemId: "G2.7",
    nameEn: "Proof of Capital Contributions",
    intent:
      "Nachweise über Kapitaleinlagen: Bank statements or transfer confirmations showing founding capital paid in.",
    isLocked: true,
  },
  {
    itemId: "G2.8",
    nameEn: "Rules of procedure(if available)",
    intent:
      "Geschäftsordnungen: Only applicable if founding group has already drafted internal rules of procedure for their cooperative assembly (GV) or supervisory board (AR).",
    isLocked: false,
  },
  {
    itemId: "G2.9",
    nameEn: "Tax Pre-Assessment(if available)",
    intent:
      "Steuerliche Vorabbeurteilung: Confirmation from Finanzamt on tax treatment of the cooperative entity in formation.",
    isLocked: false,
  },
  {
    itemId: "G2.10",
    nameEn: "Other Relevant Contracts",
    intent:
      "Weitere relevante Verträge: Any additional documents relevant to the founding process, such as lease agreements for business premises, partnership contracts, or loan agreements.",
    isLocked: false,
  },
];

const G3_METADATA = [
  {
    itemId: "G3.1",
    nameEn: "Name & Legal Form",
    intent:
      "Must include the proposed name of the cooperative followed by the legal form designation (e.g., 'eG').",
  },
  {
    itemId: "G3.2",
    nameEn: "Registered Office",
    intent:
      "Must specify the city and address of the cooperative's registered office.",
  },
  {
    itemId: "G3.3",
    nameEn: "Purpose of the Cooperative",
    intent:
      "Must clearly define the economic purpose and activities of the cooperative.",
  },
  {
    itemId: "G3.4",
    nameEn: "Provisions on payment of shares",
    intent:
      "Must specify the nominal value of shares, total share capital, and any required membership contributions.",
  },
  {
    itemId: "G3.5",
    nameEn: "Provisions on announcements",
    intent:
      "Must outline the rights (e.g., voting, profit distribution) and obligations (e.g., capital contributions, participation in meetings) of cooperative members.",
  },
  {
    itemId: "G3.6",
    nameEn: "Form of calling the General Assembly",
    intent:
      "Must specify the method and conditions for calling the general assembly.",
  },
  {
    itemId: "G3.7",
    nameEn: "Provisions on additional contributions or exclusion thereof",
    intent:
      "Must specify the conditions under which additional contributions may be required or members may be excluded.",
  },
  {
    itemId: "G3.8",
    nameEn: "Minimum number of members(min. 3)",
    intent: "Cannot register if fewer than 3 members are involved.",
  },
  {
    itemId: "G3.9",
    nameEn: "Formation and composition of the board",
    intent:
      "Must specify minimum 1 member if Cooperative has less than 20 members, otherwise minimum 2 members.",
  },
  {
    itemId: "G3.10",
    nameEn: "Formation of Supervisory board or waiver for <20 members",
    intent:
      "Must specify the formation of the supervisory board or a waiver if the cooperative has fewer than 20 members.",
  },
  {
    itemId: "G3.11",
    nameEn: "Fiscal Year",
    intent: "Must specify the fiscal year of the cooperative.",
  },
  {
    itemId: "G3.12",
    nameEn: "Provisions on Membership cancellation",
    intent:
      "Must specify notice periods for membership cancellation. (max. 2 years)",
  },
  {
    itemId: "G3.13",
    nameEn: "Provisions on share capital on exit",
    intent: "Specify how exiting members Geschaftguthaben is handled.",
  },
];

const G6_METADATA = [
  {
    key: "purposeDefined",
    label: "Förderzweck in der Satzung klar definiert?",
    subText: "Cooperative purpose clearly defined in statutes? (§6 Nr. 3 GenG)",
    failAlert: "Gutachten cannot be POSITIV — statutes deficient.",
  },
  {
    key: "purposePromotesMembers",
    label: "Förderzweck zielt auf Mitgliederförderung?",
    subText:
      "Purpose aims at economic/social/cultural promotion of members? (§1 GenG)",
    failAlert: "Business model not compatible with cooperative law.",
  },
  {
    key: "notInvestmentVehicle",
    label: "Kein reines Renditeobjekt für Investoren?",
    subText: "Not primarily a return-on-investment vehicle for investors?",
    failAlert: "Fundamental cooperative law violation — Gutachten = NEGATIV.",
  },
  {
    key: "purposePlausible",
    label: "Förderzweck im Kontext des Geschäftsmodells plausibel?",
    subText: "Cooperative purpose plausible in context of the business model?",
    failAlert: "Flag for conditions in Gutachten.",
  },
  {
    key: "cooperationRecognizable",
    label:
      "Kooperationsgedanke erkennbar — echte Mitgliederkooperation geplant?",
    subText:
      "Cooperative idea recognisable — genuine member cooperation planned?",
    failAlert: "Flag for conditions.",
  },
  {
    key: "notTaxInstrument",
    label: "Keine Anzeichen für Nutzung der Rechtsform als Steuerinstrument?",
    subText: "No indication of using the legal form as a tax instrument?",
    failAlert: "Flag — contact supervisory authority if confirmed.",
  },
];

export { G2_METADATA, G3_METADATA, G6_METADATA };
