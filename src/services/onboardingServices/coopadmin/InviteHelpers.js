export const sendCoopAdminInvite = async (formData) => {
  try {
    const response = await fetch(
      `/api/adminInvite/${encodeURIComponent(formData.coopId)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      },
    );

    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error sending admin invite:", error);
    throw error;
  }
};

export const validateEmail = async (email) => {
  try {
    const response = await fetch(
      `/api/adminInvite/fetchEmail/${encodeURIComponent(email)}`,
    );

    const data = await response.json();

    return data.profile;
  } catch (error) {
    console.error("Error validating email:", error);
    throw error;
  }
};
