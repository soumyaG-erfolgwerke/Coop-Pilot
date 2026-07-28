export const createGroup = async ({
  name,
  coopId,
  createdBy,
  members = [],
  isAllMembers = false,
}) => {
  try {
    const res = await fetch("/api/coops/groups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        coopId,
        createdBy,
        members,
        isAllMembers,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to create group");
    }

    return {
      success: true,
      data: data.group,
    };
  } catch (error) {
    console.error("createGroup error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};


export const getGroups = async (coopId) => {
  try {
    if (!coopId) throw new Error("coopId required");

    const res = await fetch(
      `/api/coops/groups?coopId=${encodeURIComponent(coopId)}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to fetch groups");
    }

    return {
      success: true,
      data: data.groups || [],
    };
  } catch (error) {
    console.error("getGroups error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};


export const deleteGroup = async (groupId) => {
  try {
    if (!groupId) throw new Error("groupId required");

    const res = await fetch(
      `/api/coops/groups?groupId=${encodeURIComponent(groupId)}`,
      {
        method: "DELETE",
      },
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to delete group");
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (error) {
    console.error("deleteGroup error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};

export const updateGroup = async ({
  groupId,
  name,
  members = [],
  isAllMembers = false,
}) => {
  try {
    if (!groupId) throw new Error("groupId required");

    const res = await fetch(
      `/api/coops/groups?groupId=${encodeURIComponent(groupId)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          members,
          isAllMembers,
        }),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to update group");
    }

    return {
      success: true,
      data: data.group,
    };
  } catch (error) {
    console.error("updateGroup error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};
