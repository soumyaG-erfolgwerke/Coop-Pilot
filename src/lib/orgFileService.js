import { readJsonResponse } from "./orgAdminService";

export async function fetchAuditOrgFiles() {
  try {
    const res = await fetch("/api/orgadmin/audit-org/files");
    const data = await readJsonResponse(
      res,
      "Failed to fetch audit organization files",
    );

    return data.files || {};
  } catch (err) {
    throw err;
  }
}

export const updateAuditOrgFiles = async ({ field, file = null, action = file ? "upload" : "delete" }) => {
  const formData = new FormData();
  formData.append("field", field);
  formData.append("action", action);

  if (file) {
    formData.append("file", file);
  }

  try {
    const res = await fetch("/api/orgadmin/audit-org/files", {
      method: "POST",
      body: formData,
    });

    const data = await readJsonResponse(
      res,
      "Failed to update audit organization files",
    );

    return data;
  } catch (err) {
    throw err;
  }
};
