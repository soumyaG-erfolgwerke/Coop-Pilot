export const getNotices = async (coopId = "") => {
  try {
    const url = coopId ? `/api/notices?coopId=${encodeURIComponent(coopId)}` : "/api/notices";
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch notices");
    }
    return data.data || [];
  } catch (error) {
    console.error("Error in getNotices:", error);
    throw error;
  }
};

export const createNotice = async ({ coopId, title, desc, expireDate }) => {
  try {
    const response = await fetch("/api/notices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ coopId, title, desc, expireDate }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to create notice");
    }
    return data.data;
  } catch (error) {
    console.error("Error in createNotice:", error);
    throw error;
  }
};

