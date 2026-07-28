const BASE_URL = `/api/payments`;

export const stripeService = {
  fetchCoopPaymentData: async (coopId) => {
    const response = await fetch(`${BASE_URL}/coops/${coopId}`);
    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || "Failed to fetch coop payment data");
    }

    return data;
  },

  linkStripeAccount: async (coopId) => {
    const response = await fetch(`${BASE_URL}/coops/${coopId}/link`, {
      method: "POST",
    });
    const data = await response.json();

    if (!response.ok || (data.success === false && data.error)) {
      throw new Error(data.error || "Failed to generate onboarding link");
    }

    return data;
  },

  createSubscription: async (coopId, planId) => {
    const response = await fetch(`${BASE_URL}/coops/${coopId}/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    });
    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || "Failed to create subscription");
    }
    return data;
  },

  createPortalSession: async (coopId) => {
    const response = await fetch(`${BASE_URL}/coops/${coopId}/portal`, {
      method: "POST",
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || "Failed to launch billing portal");
    }

    return data;
  },

  buyShares: async (coopId, shares, txId) => {
    const response = await fetch(`${BASE_URL}/member/purchase`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coopId: coopId, shares: Number(shares), txId: txId }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error || "Failed to generate share purchase link");
    }

    return data;
  },
};
