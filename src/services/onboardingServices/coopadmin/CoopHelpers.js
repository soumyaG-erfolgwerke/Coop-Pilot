export const getInvitedCoopsByAdminEmail = async (email, token = "") => {
  try {
    const response = await fetch(
      `/api/onboardAdmin/fetchCoops/${encodeURIComponent(email)}?token=${encodeURIComponent(token)}`,
    );
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching coop by admin email:", error);
    throw error;
  }
};

export const fetchCoopsDataById = async (id) => {
  try {
    const response = await fetch(`/api/coops/fetchByIds/${encodeURIComponent(id)}`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching coop by admin email:", error);
    throw error;
  }
};
