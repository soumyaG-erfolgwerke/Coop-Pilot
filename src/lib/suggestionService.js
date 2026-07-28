export const createSuggestion = async (title, description, tab) => {
  try {
    const response = await fetch("/api/suggestions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, description, tab }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to create suggestion");
    }

    return data;
  } catch (error) {
    console.error("Error creating suggestion:", error);
    throw error;
  }
};
