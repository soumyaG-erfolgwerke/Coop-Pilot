// Client-side service - uses API routes for server-side operations

export async function getCoopRegistry() {
  try {
    const res = await fetch("/api/coopAdminSignUpV2/registry");
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.documents;
  } catch (error) {
    console.error("Error fetching coop registry:", error);
    throw error;
  }
}

export async function searchExistingUser(email) {
  try {
    const res = await fetch("/api/coopAdminSignUpV2/searchUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.exists;
  } catch (error) {
    console.error("Error during profile verification check:", error);
    return false;
  }
}

export async function emailVerification() {
  const res = await fetch("/api/coopAdminSignUpV2/verification/email", {
    method: "POST",
  });
  const data = await res.json();
  if (!data.success)
    throw new Error(data.error || "Failed to send verification email");
  return { status: 200, message: "Verification email sent successfully" };
}

export async function updateEmailVerification(userId, secret) {
  try {
    const res = await fetch("/api/coopAdminSignUpV2/verification/email", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, secret }),
    });
    const data = await res.json();
    return data.success;
  } catch (error) {
    console.error("Error verifying email:", error);
    return false;
  }
}

export async function phoneVerification() {
  const res = await fetch("/api/coopAdminSignUpV2/verification/phone", {
    method: "POST",
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Failed to send OTP");
  return true;
}

export async function updatePhoneVerification(userId, secret) {
  const res = await fetch("/api/coopAdminSignUpV2/verification/phone", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, secret }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Phone verification failed");
  return data.success;
}

export const createCoopAdminNew = async (formData) => {
  try {
    const payload = new FormData();

    const { satzungFile, avvFile, ...metaData } = formData;

    if (!satzungFile) {
      return {
        success: false,
        error: "The Satzung (Articles of Association) file is required.",
        code: 400,
      };
    }

    payload.append("satzungFile", satzungFile);
    if (avvFile) { payload.append("avvFile", avvFile) }
    payload.append("meta", JSON.stringify(metaData));

    const res = await fetch("/api/coopAdminSignUpV2/create", {
      method: "POST",
      body: payload,
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        success: false,
        error: data.error || "Failed to create cooperative admin account.",
        code: res.status,
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch (error) {
    console.error("createCoopAdminNew Error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected network error occurred.",
      code: 500,
    };
  }
};

export async function getPendingCoop() {
  try {
    const res = await fetch("/api/coopAdminSignUpV2/pending");
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.documents;
  } catch (error) {
    console.error("Error fetching pending coops:", error);
    throw error;
  }
}

export async function approveCoopPlatformRegistry($id) {
  try {
    const res = await fetch(`/api/coopAdminSignUpV2/approve/${$id}`, {
      method: "PATCH",
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.document;
  } catch (error) {
    console.error("Error approving coop:", error);
    throw error;
  }
}

export async function updateVerificationInProfile(userId) {
  try {
    const res = await fetch("/api/coopAdminSignUpV2/profile/verify", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.document;
  } catch (error) {
    console.error("Error updating verification in profile:", error);
    throw error;
  }
}

export async function checkEmailValidation() {
  try {
    const res = await fetch("/api/coopAdminSignUpV2/checkEmailValidation");
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return data.isEmailVerified;
  } catch (error) {
    console.error("Error checking email verification status:", error);
    throw error;
  }
}

export const checkCoopExists = async (registryNumber) => {
  const res = await fetch("/api/coopAdminSignUpV2/coopCheck", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({ registryNumber }),
  });

  return await res.json();
};
