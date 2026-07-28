export const membersAndSharesData = {
  tag: "Module 1 — Members & Shares",
  title: "Know every member. Every share. Every change — in real time.",
  description:
    "CoopPilot's digital member register is the legally proof source of truth. Manage member entries, exits, share transfers, and GenG-compliant lists automatically. Ready for auditor export.",
  checklist: [
    "Digital membership application (PDF)",
    "Share management & dynamic share register",
    "KYC checks & upload signatures",
    "Pending/cancelled applications tracking",
    "Quick exports & search filters",
  ],
  mockup: {
    title: "Cooppilot Admin Portal",
    subtitle: "Member Register",
    registryTitle: "Member Registry",
    members: [
      {
        name: "Jimmy McGill",
        email: "saulgoodman@gmail.com",
        amount: "€456",
        shares: 87,
        joined: "26 NOV,2023",
        status: "Active",
        initials: "JM",
        avatarBg: "bg-blue-100 text-blue-600",
      },
      {
        name: "Kim Waxler",
        email: "kimgoodman@gmail.com",
        amount: "€877",
        shares: 87,
        joined: "26 NOV,2023",
        status: "Active",
        initials: "KW",
        avatarBg: "bg-purple-100 text-purple-600",
      },
      {
        name: "Walter White",
        email: "bluemeth@gmail.com",
        amount: "€4,552",
        shares: 87,
        joined: "26 NOV,2023",
        status: "Pending",
        initials: "WW",
        avatarBg: "bg-slate-100 text-slate-600",
      },
      {
        name: "Gustavo Fring",
        email: "themanager@gmail.com",
        amount: "€1,000",
        shares: 87,
        joined: "26 NOV,2023",
        status: "Pending",
        initials: "GF",
        avatarBg: "bg-amber-100 text-amber-600",
      },
    ],
  },
};

export const governanceData = {
  tag: "Module 3 — Governance",
  title: "Run your general assembly digitally — all 4 formats, legally valid.",
  description:
    "Organize, invite, and vote digitally or hybrid. CoopPilot supports all formats: from in-person to purely online, with automated proxy management and legally binding vote counting.",
  checklist: [
    "AGM invitation & agenda builder",
    "Digital ballot box & instant results",
    "Proxy representation management",
    "Live quorum tracking & automated minutes",
    "Multi-lingual translations",
    "Post-assembly legal exports",
  ],
  mockup: {
    title: "General Assembly Summary View",
    subtitle: "QUORUM REACHED",
    stats: [
      { label: "Quorum", value: "84%", subtext: "Req. 50%" },
      { label: "Votes Cast", value: "132 / 158", subtext: "83.5% turnout" },
      { label: "Resolutions", value: "3 / 3", subtext: "Passed" },
    ],
    consensus: {
      tag: "Consensus: Resolution #26",
      status: "Passed",
      title: "Approval of cooperative financial statements & dividend allocation (fiscal year 2025)",
      yesVotes: 121,
      noVotes: 11,
      yesPercent: "92%",
      noPercent: "8%",
    },
    attendance: [
      { label: "42 In-Person" },
      { label: "73 Online" },
      { label: "17 Proxies" },
    ],
    footnote: "⚖ GenG compliant digital signatures & immutable log files.",
  },
};

export const memberPortalData = {
  tag: "Module 4 — Member Portal",
  title: "Every member gets their own digital home — included free.",
  description:
    "Our member portal makes cooperative membership accessible and transparent. Members can view their shares, track payouts, vote on resolutions, and download necessary documents directly.",
  checklist: [
    "Personal share dashboard & details",
    "Resolution voting interface",
    "Document download center",
    "Direct team messaging",
    "Dynamic newsletter feed & updates",
  ],
  mockup: {
    title: "CoopPilot Member Portal",
    subtitle: "ONLINE",
    welcome: {
      tag: "Member Workspace",
      heading: "Hi Jimmy, welcome back!",
      meta: "Member ID: #0482 • Join Date: Jan 2024",
      initials: "KD",
    },
    stats: [
      { label: "My Shares", value: "10 Shares", subtext: "Value: €1,000" },
      { label: "Dividend Yield", value: "4.5%", subtext: "Payouts: €45.00" },
    ],
    assembly: {
      tag: "Next Assembly",
      date: "12 Oct 2026, 18:00 (CET)",
      action: "Vote",
    },
    documents: [
      { name: "Annual Financial Report 2025", type: "PDF", size: "3.4 MB" },
      { name: "Minutes of General Assembly (Oct 2025)", type: "PDF", size: "850 KB" },
    ],
  },
};
