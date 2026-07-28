export const getFormerMembersOfCoop = async (coopId) => {
  if (!coopId) throw new Error("coopId is required.");

  try {
    const res = await fetch(`/api/coop-r-member/former-members?coopId=${encodeURIComponent(coopId)}`);
    if (!res.ok) {
      throw new Error(`Error: ${res.statusText}`);
    }
    const data = await res.json();
    return data.members || [];
  } catch (err) {
    console.error("Failed to fetch former members for coop:", err);
    throw err;
  }
};