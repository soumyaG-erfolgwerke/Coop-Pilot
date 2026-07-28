import { uploadFileAndGetURL } from "@/lib/addCoopService";

export const readJsonResponse = async (response, fallbackMessage) => {
  let data = null;
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      data = await response.json();
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
    }
  }

  if (!response.ok || data?.success === false) {
    throw new Error(data?.error || data?.message || fallbackMessage);
  }

  return data;
};


export const getOrgAdminAuditOrg = async () => {
  const response = await fetch("/api/orgadmin/audit-org", {
    method: "GET",
    cache: "no-store",
  });

  return readJsonResponse(response, "Failed to fetch audit organization");
};

export const getOrgAdminTeamMembers = async (optionsOrOrgId = {}) => {
  const options =
    typeof optionsOrOrgId === "object" && optionsOrOrgId !== null
      ? optionsOrOrgId
      : { orgId: optionsOrOrgId };

  const params = new URLSearchParams();

  if (options.orgId) {
    params.set("orgId", options.orgId);
  }

  if (options.page) {
    params.set("page", String(options.page));
  }

  if (options.limit) {
    params.set("limit", String(options.limit));
  }

  if (options.search) {
    params.set("search", options.search);
  }

  const queryString = params.toString();
  const response = await fetch(
    `/api/orgadmin/team-member${queryString ? `?${queryString}` : ""}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  return readJsonResponse(response, "Failed to fetch team members");
};

const resolveOrgAdminAuditOrgId = async () => {
  const auditOrgResponse = await getOrgAdminAuditOrg();
  return auditOrgResponse?.auditOrg?.id || null;
};

export const createOrgAdminTeamMember = async (memberData) => {
  const auditOrgId = await resolveOrgAdminAuditOrgId();

  if (!auditOrgId) {
    throw new Error("Failed to resolve audit organization");
  }

  const response = await fetch("/api/orgadmin/team-member", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auditOrgId,
      name: memberData?.name || "",
      email: memberData?.email || "",
      password: memberData?.password || "",
      role: memberData?.role || "",
      empId: memberData?.empId || "",
      isActive: Boolean(memberData?.isActive),
    }),
  });

  return readJsonResponse(response, "Failed to create team member");
};

export const updateOrgAdminTeamMember = async (memberData) => {
  const auditOrgId = await resolveOrgAdminAuditOrgId();

  if (!auditOrgId) {
    throw new Error("Failed to resolve audit organization");
  }
  const memberId = memberData?.id;

  if (!memberId) {
    throw new Error("Failed to resolve team member id");
  }

  const response = await fetch("/api/orgadmin/team-member", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: memberId,
      auditOrgId,
      email: memberData?.email || "",
      name: memberData?.name || "",
      role: memberData?.role || "",
      empId: memberData?.empId || "",
      isActive: Boolean(memberData?.isActive),
    }),
  });

  return readJsonResponse(response, "Failed to update team member");
};

/**
 * Creates a new Organization Admin and registers their organization.
 * Handles client-side uploading of logo and stamp images before invoking the API.
 *
 * @param {object} formData - The wizard form data object.
 * @returns {Promise<object>} The server response containing success/error.
 */
export const createOrgAdmin = async (formData) => {
  try {
    let logoUrl = null;
    let stampUrl = null;

    if (formData.logoFile && formData.logoFile instanceof File) {
      logoUrl = await uploadFileAndGetURL(formData.logoFile, "coop");
    }

    if (formData.stampFile && formData.stampFile instanceof File) {
      stampUrl = await uploadFileAndGetURL(formData.stampFile, "coop");
    }

    const payload = new FormData();
    payload.append("email", formData.email || "");
    payload.append("title", formData.title || "");
    payload.append("firstName", formData.firstName || "");
    payload.append("lastName", formData.lastName || "");
    payload.append("phoneCountryCode", formData.phoneCountryCode || "");
    payload.append("phoneNumber", formData.phoneNumber || "");
    payload.append("password", formData.password || "");
    payload.append("organisationName", formData.organisationName || "");
    payload.append("abbreviation", formData.abbreviation || "");
    payload.append("street", formData.street || "");
    payload.append("city", formData.city || "");
    payload.append("postcode", formData.postcode || "");
    payload.append("state", formData.state || "");
    payload.append("zulassungNumber", formData.zulassungNumber || "");
    payload.append("sectorFocus", formData.sectorFocus || "");
    payload.append("website", formData.website || "");
    payload.append("iban", formData.iban || "");
    payload.append("ibanAccountHolder", formData.ibanAccountHolder || "");
    payload.append("bic", formData.bic || "");
    payload.append("logoUrl", logoUrl || "");
    payload.append("stampUrl", stampUrl || "");

    if (formData.avvFile instanceof File) {
      payload.append("avvFile", formData.avvFile);
    }

    const res = await fetch("/api/orgadmin/create", {
      method: "POST",
      body: payload,
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error creating org admin:", error);
    return {
      success: false,
      error: {
        message: error.message || "Failed to submit request.",
        code: error.code || 500,
      },
    };
  }
};
