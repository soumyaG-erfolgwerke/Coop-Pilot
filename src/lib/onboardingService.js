export const uploadOnboardingSatzung = async (doc) => {
  if (!doc?.file) {
    throw new Error("Document required");
  }

  try {
    const formData = new FormData();

    formData.append("file", doc.file);

    formData.append(
      "meta",

      JSON.stringify({
        email: doc.email,
      }),
    );

    const response = await fetch("/api/onboarding/upload", {
      method: "POST",
      body: formData,
    });

    const res = await response.json();

    if (!response.ok) {
      throw new Error(res.error?.message || "Upload failed");
    }

    return res.data;
  } catch (error) {
    console.error(error);

    throw error;
  }
};
