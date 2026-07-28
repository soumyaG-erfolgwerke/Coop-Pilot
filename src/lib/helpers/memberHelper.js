// Get all members(userId, memberName, memberEmail)
export const getAllMembers = async () => {
  try {
    const response = await fetch("/api/member/all", {
      method: "GET",
      credentials: "include",
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || "Failed to fetch members");
    }

    const members = (result.members || []).map((member) => ({
      userId: member.userId,
      membername: member.memberName,
      memberemail: member.memberEmail,
    }));
    return members;
  } catch (error) {
    console.error("GET_ALL_MEMBERS_SERVICE_ERROR:", error);
    return [];
  }
};