// get org details for auditor by fetch() call at /api/auditor/audit-org

import { readJsonResponse } from "./orgAdminService";

export const fetchAuditorAuditOrg = async () => {
  const response = await fetch("/api/auditor/audit-org", {
    method: "GET",
    cache: "no-store",
  });

  return readJsonResponse(response, "Failed to fetch audit organization");
}

