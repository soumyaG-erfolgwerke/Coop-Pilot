// Client-side service - uses API routes for ticket operations

// -----------------------------
// Status config
// -----------------------------
const STATUSES = Object.freeze([
  "Issued",
  "InProgress",
  "InReview",
  "Completed",
  "Cancelled",
]);

const ensureValidStatus = (status) => {
  if (!STATUSES.includes(status)) {
    throw new Error(
      `Invalid status: ${status}. Allowed: ${STATUSES.join(", ")}`,
    );
  }
};

// -----------------------------
// Core CRUD
// -----------------------------
export const getAllTickets = async () => {
  try {
    const res = await fetch("/api/ticket");
    const data = await res.json();
    return data.tickets || [];
  } catch (err) {
    console.error("Error fetching tickets:", err);
    return [];
  }
};

export const getTicketById = async (id) => {
  try {
    const res = await fetch(`/api/ticket/${encodeURIComponent(id)}`);
    const data = await res.json();
    return data.ticket || null;
  } catch (err) {
    console.error(`Error fetching ticket ${id}:`, err);
    return null;
  }
};

export const createTicket = async ({
  subject,
  scope,
  status = "Issued",
  leadAuditor,
  auditId,
  forCoop,
  comments = [],
}) => {
  try {
    ensureValidStatus(status);
    const res = await fetch("/api/ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        scope,
        status,
        leadAuditor,
        forCoop,
        comments,
        auditId,
      }),
    });
    const data = await res.json();
    return data.ticket || null;
  } catch (err) {
    console.error("Error creating ticket:", err);
    return null;
  }
};

// -----------------------------
// Queries & helpers
// -----------------------------

export const getTicketsByCoop = async (forCoop, { order = "asc" } = {}) => {
  try {
    const res = await fetch(
      `/api/ticket/by-coop?forCoop=${encodeURIComponent(forCoop)}&order=${order}`,
    );
    const data = await res.json();
    return data.tickets || [];
  } catch (err) {
    console.error(`Error fetching tickets for coop '${forCoop}':`, err);
    return [];
  }
};

export const getTicketsByAuditor = async (
  auditorId,
  { order = "desc" } = {},
) => {
  try {
    const res = await fetch(
      `/api/ticket/by-auditor?auditorId=${encodeURIComponent(auditorId)}&order=${order}`,
    );
    const data = await res.json();
    return data.tickets || [];
  } catch (err) {
    console.error(`Error fetching tickets for auditor '${auditorId}':`, err);
    return [];
  }
};

export const getTicketComments = async (ticketId, order = "asc") => {
  try {
    const res = await fetch(
      `/api/ticket/${encodeURIComponent(ticketId)}/comments?order=${order}`,
    );
    const data = await res.json();
    return data.comments || [];
  } catch (err) {
    console.error(`Error fetching comments for ticket '${ticketId}':`, err);
    return [];
  }
};

// -----------------------------
// Status updates & comments
// -----------------------------
export const updateTicketStatus = async (id, status) => {
  try {
    ensureValidStatus(status);
    const res = await fetch(`/api/ticket/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    return data.ticket || null;
  } catch (err) {
    console.error(
      `Error updating status for ticket '${id}' to '${status}':`,
      err,
    );
    return null;
  }
};

// Convenience wrappers
export const markTicketIssued = (id) => updateTicketStatus(id, "Issued");
export const markTicketInProgress = (id) =>
  updateTicketStatus(id, "InProgress");
export const markTicketInReview = (id) => updateTicketStatus(id, "InReview");
export const markTicketCompleted = (id) => updateTicketStatus(id, "Completed");
export const markTicketCancelled = (id) => updateTicketStatus(id, "Cancelled");

export const addTicketComment = async (
  id,
  { creator, text, timestamp = new Date().toISOString() },
  { newStatus } = {},
) => {
  try {
    if (newStatus) ensureValidStatus(newStatus);

    // console.log("addTicketComment");

    // enforce Appwrite's 5000-char per string limit (leave room for JSON keys)
    const MAX = 5000;
    const payloadStr = JSON.stringify({ creator, text, timestamp });
    if (payloadStr.length > MAX) {
      throw new Error(`Comment too long (${payloadStr.length} > ${MAX}).`);
    }

    const res = await fetch(`/api/ticket/${encodeURIComponent(id)}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creator, text, timestamp, newStatus }),
    });
    const data = await res.json();
    return data.ticket || null;
  } catch (err) {
    console.error(`Error adding comment to ticket '${id}':`, err);
    return null;
  }
};
