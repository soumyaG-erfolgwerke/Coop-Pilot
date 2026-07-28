// Client-side service - uses API routes for transaction operations

const hydrateSharePurchaseWithSettings = async (transaction) => {
  if (!transaction?.coopId) return transaction;

  const isSharePurchase =
    transaction.transactionType === "purchase" ||
    transaction.transactionType === "share_purchase";

  if (!isSharePurchase || typeof transaction.shares !== "number") {
    return transaction;
  }

  try {
    const response = await fetch(
      `/api/cooperative/settings/${encodeURIComponent(transaction.coopId)}`,
      {
        method: "GET",
        credentials: "include",
      }
    );

    const data = await response.json();
    if (!data.success || !data.settings) {
      return transaction;
    }

    const { min_shares, max_shares, share_price_cents } = data.settings;

    if (transaction.shares < min_shares || transaction.shares > max_shares) {
      throw new Error(
        `Shares must be between ${min_shares} and ${max_shares} for this cooperative.`
      );
    }

    const totalAmountCents = transaction.shares * share_price_cents;
    return {
      ...transaction,
      share_price_at_time_cents: share_price_cents,
      total_amount_cents: totalAmountCents,
      price: totalAmountCents / 100,
    };
  } catch (error) {
    if (error.message?.includes("Shares must be between")) {
      throw error;
    }
    return transaction;
  }
};

export const addTransaction = async (transaction) => {
  try {
    //const hydratedTransaction = await hydrateSharePurchaseWithSettings(transaction);
    const res = await fetch("/api/transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transaction),
    });
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to create transaction");
    }
    return data.transaction;
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

export const getTransactions = async () => {
  try {
    const res = await fetch("/api/transaction");
    const data = await res.json();
    return data.transactions;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};

export const updateTransaction = async (transactionId, updatedTransaction) => {
  try {
    const res = await fetch(`/api/transaction/${encodeURIComponent(transactionId)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedTransaction),
    });
    const data = await res.json();
    return data.transaction;
  } catch (error) {
    console.error("Error updating transaction:", error);
    throw error;
  }
};

export const updateTransactionStatus = async (transactionId, newStatus) => {
  try {
    const res = await fetch(`/api/transaction/${encodeURIComponent(transactionId)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (!data.success) throw new Error("Failed to update transaction status");
    return data.transaction;
  } catch (err) {
    console.error("Failed to update transaction status:", err);
    throw err;
  }
};

export const getTransactionsByCoopId = async (coopId) => {
  if (!coopId) {
    throw new Error("Cooperative ID is required.");
  }
  try {
    const res = await fetch(`/api/transaction/by-coop?coopId=${encodeURIComponent(coopId)}`);
    const data = await res.json();
    return data.transactions;
  } catch (error) {
    console.error(`Failed to fetch transactions for coopId ${coopId}:`, error);
    throw error;
  }
};

export const getTransactionsByMemberId = async (memberId) => {
  if (!memberId) {
    throw new Error("Member ID is required.");
  }
  try {
    const res = await fetch(`/api/transaction/by-member?memberId=${encodeURIComponent(memberId)}`);
    const data = await res.json();
    return data.transactions;
  } catch (error) {
    console.error(
      `Failed to fetch transactions for memberId ${memberId}:`,
      error
    );
    throw error;
  }
};

export const getVerifiedTransactionsByCoopId = async (coopId) => {
  if (!coopId) {
    throw new Error("Cooperative ID is required.");
  }
  try {
    const res = await fetch(`/api/transaction/verified/by-coop?coopId=${encodeURIComponent(coopId)}`);
    const data = await res.json();
    return data.transactions;
  } catch (error) {
    console.error(`Failed to fetch transactions for coopId ${coopId}:`, error);
    throw error;
  }
};

export const getVerifiedTransactionsByMemberId = async (memberId) => {
  if (!memberId) {
    throw new Error("Member ID is required.");
  }
  try {
    const res = await fetch(`/api/transaction/verified/by-member?memberId=${encodeURIComponent(memberId)}`);
    const data = await res.json();
    return data.transactions;
  } catch (error) {
    console.error(
      `Failed to fetch transactions for memberId ${memberId}:`,
      error
    );
    throw error;
  }
};

export const getMembersOfCoop = async (coopId) => {
  if (!coopId) throw new Error("coopId is required.");

  try {
    const res = await fetch(`/api/coop-r-member/members-of-coop?coopId=${encodeURIComponent(coopId)}`);
    const data = await res.json();
    return data.members || [];
  } catch (err) {
    console.error("Failed to fetch members for coop:", err);
    throw err;
  }
};

export const getMembersOfCoopOld = async (coopId) => {
  if (!coopId) throw new Error("coopId is required.");

  try {
    const res = await fetch(`/api/transaction/members-of-coop?coopId=${encodeURIComponent(coopId)}`);
    const data = await res.json();
    return data.members || [];
  } catch (err) {
    console.error("Failed to fetch members for coop:", err);
    throw err;
  }
};

export const getCoopsOfMembers = async (memberId) => {
  if (!memberId) throw new Error("memberId is required.");

  try {
    const res = await fetch(`/api/coop-r-member/coops-of-member?memberId=${encodeURIComponent(memberId)}`);
    const data = await res.json();
    return data.coops || [];
  } catch (err) {
    console.error("Failed to fetch coops for member:", err);
    throw err;
  }
};

export const getCoopsOfMembersOld = async (memberId) => {
  if (!memberId) throw new Error("memberId is required.");

  try {
    const res = await fetch(`/api/transaction/coops-of-member?memberId=${encodeURIComponent(memberId)}`);
    const data = await res.json();
    return data.coops || [];
  } catch (err) {
    console.error("Failed to fetch coops for member:", err);
    throw err;
  }
};
