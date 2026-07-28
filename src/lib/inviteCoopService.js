import { readJsonResponse } from "./orgAdminService";
export const inviteCoop = async (inviteData) => {
  try {
    const response = await fetch("/api/orgadmin/invite-coop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inviteData),
      });
      
      return await readJsonResponse(response);
  } catch (error) {
    console.error("Error inviting cooperative:", error);
    throw error;
  }
};
