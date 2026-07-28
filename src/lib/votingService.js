// Voting Service - API Client Functions

export const fetchVotingLegalConfig = async (coopId) => {
  if (!coopId) {
    throw new Error("coopId is required");
  }

  const response = await fetch(`/api/cooperative/settings/${encodeURIComponent(coopId)}`, {
    method: "GET",
    credentials: "include",
  });
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch cooperative settings");
  }

  return result.settings;
};

export const getMinimumAgmDate = async (coopId, fromDate = new Date()) => {
  const settings = await fetchVotingLegalConfig(coopId);
  const baseDate = new Date(fromDate);
  baseDate.setDate(baseDate.getDate() + Number(settings.agm_notice_period_days || 0));
  return baseDate;
};

export const evaluateQuorum = ({
  quorumType,
  quorumThresholdPercent,
  presentShares,
  totalShares,
  presentMembers,
  totalMembers,
}) => {
  const threshold = Number(quorumThresholdPercent || 0);

  if (quorumType === "MITGLIEDERBASIERT") {
    const percent = totalMembers > 0 ? (presentMembers / totalMembers) * 100 : 0;
    return {
      isMet: percent >= threshold,
      calculatedPercent: percent,
      basis: "members",
    };
  }

  const percent = totalShares > 0 ? (presentShares / totalShares) * 100 : 0;
  return {
    isMet: percent >= threshold,
    calculatedPercent: percent,
    basis: "shares",
  };
};

export const evaluateQuorumForCoop = async ({
  coopId,
  presentShares = 0,
  totalShares = 0,
  presentMembers = 0,
  totalMembers = 0,
}) => {
  const settings = await fetchVotingLegalConfig(coopId);
  return evaluateQuorum({
    quorumType: settings.quorum_type,
    quorumThresholdPercent: settings.quorum_threshold_percent,
    presentShares,
    totalShares,
    presentMembers,
    totalMembers,
  });
};

export const createPolls = async (
  coopId,
  options,
  endTime,
  title,
  description,
  isCritical = false,
  assemblyId = ""
) => {
  try {
    const response = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coopId,
        options,
        endTime,
        title,
        description,
        isCritical,
        assemblyId,
      }),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
  } catch (error) {
    console.error("Error in creating voting:", error);
    throw error;
  }
};

export const getMemberPollsByCoopId = async (coopId, userId, currentTime) => {
  try {
    const params = new URLSearchParams({
      coopId,
      userId,
      currentTime,
    });

    const response = await fetch(`/api/vote/member?${params}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
  } catch (error) {
    console.error("Error in getMemberPollsByCoopId:", error);
    throw error;
  }
};

export const getPollsByCoopId = async (coopId) => {
  try {
    const response = await fetch(`/api/vote/coop/${coopId}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
  } catch (error) {
    console.error("Error in getting voting by Coop ID:", error);
    throw error;
  }
};

export const getActivePollsCountByCoopId = async (coopId, currentTime) => {
  try {
    const params = new URLSearchParams({
      coopId,
      currentTime,
    });

    const response = await fetch(`/api/vote/count?${params}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
  } catch (error) {
    console.error("Error in getting polls count by Coop ID:", error);
    throw error;
  }
};

export const castVote = async ($id, userId, selectedOption) => {
  try {
    const response = await fetch("/api/vote/cast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ $id, userId, selectedOption }),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
  } catch (error) {
    console.error("Error in casting vote:", error);
    throw error;
  }
};

export const getAssemblyPolls = async (assemblyId) => {
  if (!assemblyId) {
    throw new Error("assemblyId is required");
  }

  const params = new URLSearchParams({ assemblyId });
  const response = await fetch(`/api/vote/assembly?${params}`, {
    method: "GET",
    credentials: "include",
  });
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch assembly polls");
  }

  return result.polls || [];
};

export const closeAssemblyPolls = async (assemblyId, coopId) => {
  if (!assemblyId || !coopId) {
    throw new Error("assemblyId and coopId are required");
  }

  const response = await fetch("/api/vote/assembly/close", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ assemblyId, coopId }),
  });
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to close polls");
  }

  return result;
};

export const closePoll = async (pollId, coopId) => {
  if (!pollId || !coopId) {
    throw new Error("pollId and coopId are required");
  }

  const response = await fetch("/api/vote/close", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ pollId, coopId }),
  });
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to close poll");
  }

  return result.poll;
};
