/**Fetches the total number of verified members in a cooperative.
 * @param {string} coopId - The ID of the cooperative.
 * @returns {Promise<number>} The total number of verified members in the cooperative.
 */

export const getTotalVerifiedMembersOfCoop = async (coopId) => {
  if (!coopId) throw new Error("coopId is required.");

  try {
    const res = await fetch(
      `/api/transaction/verified-members-of-coop?coopId=${encodeURIComponent(coopId)}`,
    );
    const data = await res.json();
    return data.verifiedMembers?.length || 0;
  } catch (err) {
    console.error("Failed to fetch verified members for coop:", err);
    throw err;
  }
};

// export const getTotalMembersOfCoop = async (coopId) => {
//   if (!coopId) throw new Error("coopId is required.");

//   try {
//     const res = await fetch(
//       `/api/transaction/members-of-coop?coopId=${encodeURIComponent(coopId)}`,
//     );
//     const data = await res.json();
//     return data.members?.length || 0;
//   } catch (err) {
//     console.error("Failed to fetch members for coop:", err);
//     throw err;
//   }
// };

export const newVerifiedMemeberFromRelationTable = async (coopId) => {
  if (!coopId) throw new Error("coopId is required.");

  try {
    const res = await fetch(
      `/api/coop-r-member/new-verified-member-count?coopId=${encodeURIComponent(coopId)}`,
    );
    const data = await res.json();
    return data.count || 0;
  } catch (err) {
    console.error("Failed to fetch new verified member count:", err);
    throw err;
  }
};

//! gives the actual number of members @anix003,
// review and update the getTotalMembersOfCoop with endpoint if needed @anix003
export const getTotalMembersOfCoop = async (coopId) => {
  if (!coopId) throw new Error("coopId is required.");

  try {
    const res = await fetch(
      `/api/coop-r-member/assembly-member-count?coopId=${encodeURIComponent(coopId)}`,
    );

    // api/coop-r-member/assembly-member-count
    const data = await res.json();
    return data.count || 0;
  } catch (err) {
    console.error("Failed to fetch members for coop:", err);
    throw err;
  }
};
