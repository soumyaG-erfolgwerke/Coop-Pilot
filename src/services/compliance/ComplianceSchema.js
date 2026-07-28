import {
  checkActiveMemberForCoop,
  checkFinancialYearForCoop,
  checkOldApplicationForCoop,
  checkOneAdminConfiguredForCoop,
  checkSatzungExistsForCoop,
  checkSharePriceForCoop,
} from "./ComplianceServices";

export const complianceSchema = [
  {
    id: 1,
    name: "satzung",
    required: true,
    text: "Upload atleast one Satzung and Current.",
    actionUrl: "/dashboard?tab=doc-upload",
    function: checkSatzungExistsForCoop,
  },
  {
    id: 2,
    name: "activeMember",
    required: true,
    text: "Add active members to your cooperative.",
    actionUrl: "/dashboard?tab=show-members",
    function: checkActiveMemberForCoop,
  },
  {
    id: 3,
    name: "hasSharePrice",
    required: true,
    text: "Set a share price for your cooperative.",
    actionUrl: "/dashboard?tab=settings",
    function: checkSharePriceForCoop,
  },
  {
    id: 4,
    name: "hasFinancialYear",
    required: true,
    text: "Define the financial year for your cooperative.",
    actionUrl: "/dashboard?tab=settings",
    function: checkFinancialYearForCoop,
  },
  {
    id: 5,
    name: "oldApplication",
    required: true,
    text: "Review and update old applications.",
    actionUrl: "/dashboard?tab=proposals",
    function: checkOldApplicationForCoop,
  },
  {
    id: 6,
    name: "adminConfig",
    required: false,
    text: "Atleast one admin fully configured.",
    actionUrl: "/dashboard?tab=verification",
    function: checkOneAdminConfiguredForCoop,
  },
  //* Add more compliance checks as needed
];
