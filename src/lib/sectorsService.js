// Client-side service - uses API route for sector operations

export const getAllSectorService = async () => {
  try {
    const res = await fetch("/api/sector");
    const data = await res.json();
    return data.sectors || [];
  } catch (error) {
    console.error("Error fetching sectors:", error);
    return [];
  }
};
