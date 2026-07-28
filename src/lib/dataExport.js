import { getProfileByUserId } from "./profileService";
import { getCoopsOfMembers, getTransactionsByMemberId } from "./transactionService";
import { getFilebyUserId } from "./getfileDetails";
import { getAllCoops } from "./getCoopsService";

export const getExportData = async (userId) => {
  try {
    if (!userId) throw new Error("userId required");

    const [
      profileRes,
      transactionRes,
      documentRes,
      coops,
      coopsofMember
    ] = await Promise.all([
      getProfileByUserId(userId),
      getTransactionsByMemberId(userId),
      getFilebyUserId(userId),
      getAllCoops(),
      getCoopsOfMembers(userId),
    ]);

    if (!profileRes.success) throw new Error("Profile fetch failed");

    const coopMap = coops.reduce((acc, c) => {
      acc[c.id] = c.name;
      return acc;
    }, {});

    const transactions = (transactionRes?.documents || []).map((tx) => ({
      ...tx,
      coopName: coopMap[tx.coopId] || "Unknown",
    }));

    const documents = (documentRes?.data || []).map((d) => ({
      ...d,
      category: d.category || d.documentType || "KYC",
    }));

    const shares = (coopsofMember || []).map((c) => ({
      coopId: c.coopId,
      coopName: c.name,
      totalShares: c.totalShares,
      totalPrice: c.totalPrice,
    }));

    const totalShares = shares.reduce((sum, s) => sum + (s.totalShares || 0), 0);
    const totalInvestment = shares.reduce((sum, s) => sum + (s.totalPrice || 0), 0);

    return {
      success: true,
      data: {
        profile: profileRes.data || null,
        transactions,
        documents,
        shares,
        summary: {
          totalShares,
          totalInvestment,
        },
        generatedAt: new Date().toISOString(),
      },
    };

  } catch (error) {
    console.error("Export Service Error:", error);

    return {
      success: false,
      error: error.message || "Export failed",
    };
  }
};