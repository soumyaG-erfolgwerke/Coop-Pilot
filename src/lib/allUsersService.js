// Client-side service that calls API routes

export const allUsersService = async () => {
  try {
    const response = await fetch("/api/userServices", {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch users");
    }
    return data.users;
  } catch (error) {
    console.error("Error in allUsersService:", error);
    throw new Error("Could not fetch and merge users");
  }
};

export const getUserByIdService = async (userId) => {
  try {
    const response = await fetch(`/api/userServices/${userId}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "User not found");
    }
    return data.user;
  } catch (error) {
    console.error(`❌ Couldn't fetch user ${userId}:`, error);
    return {
      name: "null",
      email: "null",
      role: "null",
      status: "null",
    };
  }
};

/**
 * Updates a user's profile data.
 * @param {string} userId - The user's $id.
 * @param {object} profileData - An object containing { name, phone, address }.
 */
export const updateUserProfileService = async (
  userId,
  { name, phone, address }
) => {
  try {
    const response = await fetch(`/api/userServices/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, phone, address }),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to update profile");
    }
    return data.user;
  } catch (error) {
    console.error("Failed to update user profile:", error);
    throw error;
  }
};

export const getPotentialAdmins = async () => {
  try {
    const response = await fetch("/api/userServices/potentialAdmins", {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch potential admins");
    }
    return data.admins;
  } catch (error) {
    console.error("Error in getPotentialAdmins:", error);
    throw new Error("Could not fetch potential admins");
  }
};

export const getAllAuditersService = async () => {
  try {
    const response = await fetch("/api/userServices/auditers?type=main", {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch auditors");
    }
    return data.auditers;
  } catch (error) {
    console.error("Error in getAllAuditersService:", error);
    throw new Error("Could not fetch auditors");
  }
};

export const getAllEmployeeAuditersService = async () => {
  try {
    const response = await fetch("/api/userServices/auditers?type=employee", {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch employee auditors");
    }
    return data.auditers;
  } catch (error) {
    console.error("Error in getAllEmployeeAuditersService:", error);
    throw new Error("Could not fetch auditors");
  }
};

export const getUserByListOfIdsService = async (userIds) => {
  try {
    const response = await fetch("/api/userServices/byIds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userIds }),
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch users by IDs");
    }
    return data.users;
  } catch (error) {
    console.error("Error in getUserByListOfIdsService:", error);
    throw new Error("Could not fetch users by list of IDs");
  }
};

export const getAllTypeAuditerService = async () => {
  try {
    const response = await fetch("/api/userServices/auditers?type=all", {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch all auditors");
    }
    return data.auditers;
  } catch (error) {
    console.error("Error in getAllTypeAuditerService:", error);
    throw new Error("Could not fetch auditors");
  }
};

export const getAllUsersOfApp = async () => {
  try {
    const response = await fetch("/api/userServices", {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch all users");
    }
    return data.users;
  } catch (error) {
    console.error("Error in getAllUsersOfApp:", error);
    throw new Error("Could not fetch all users");
  }
};

export const getAllActiveMembersService = async () => {
  try {
    const response = await fetch("/api/userServices/activeMembers", {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch active members");
    }
    return data.members;
  } catch (error) {
    console.error("Error in getAllActiveMembersService:", error);
    throw new Error("Could not fetch active members");
  }
};


