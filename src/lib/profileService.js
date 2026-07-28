export const getProfileByUserId = async (userId) => {
  try {
    if (!userId) {
      throw new Error("userId is required");
    }

    const res = await fetch(
      `/api/userServices/profile?userId=${encodeURIComponent(userId)}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      },
    );

    // Check if the server response is completely broken
    if (!res.ok) {
      const isJson = res.headers
        .get("content-type")
        ?.includes("application/json");
      if (isJson) {
        const errorData = await res.json();
        throw new Error(errorData?.error || `HTTP Error: ${res.status}`);
      } else {
        throw new Error(`Server returned status: ${res.status}`);
      }
    }

    const result = await res.json();

    if (!result.success) {
      throw new Error(result?.error || "Failed to fetch profile");
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error) {
    console.error("Profile Service Error:", error);

    return {
      success: false,
      error:
        error.message ||
        "An unexpected error occurred while fetching the profile.",
    };
  }
};
