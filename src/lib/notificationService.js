// Notification Service - API Client Functions

export async function createNotification({ createdFor, message }) {
  try {
    console.log("in createNoti");
    const response = await fetch("/api/notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ createdFor, message }),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId) {
  try {
    const response = await fetch(`/api/notification/${notificationId}`, {
      method: "PATCH",
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

export async function getNotificationsForUser(
  email,
  isRead = false,
  limit = null,
  offset = null,
) {
  try {
    const params = new URLSearchParams({
      email,
      isRead,
    });

    if (limit) params.append("limit", limit);
    if (offset) params.append("offset", offset);

    const response = await fetch(`/api/notification?${params}`);

    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
  } catch (error) {
    console.error("Error getting notifications:", error);
    throw error;
  }
}

export async function createNotificationForCoop(coopId, type) {
  try {
    console.log("in coop noti");
    const response = await fetch("/api/notification/coop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coopId, type }),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
  } catch (error) {
    console.error("Error creating coop notification:", error);
    throw error;
  }
}

// Bulk notification helpers

export async function notifyAllAdmins(message) {
  try {
    const response = await fetch("/api/notification/bulk?type=admins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
  } catch (error) {
    console.error("Error notifying admins:", error);
    throw error;
  }
}

export async function notifyAllAuditers(message) {
  try {
    const response = await fetch("/api/notification/bulk?type=auditers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
  } catch (error) {
    console.error("Error notifying auditers:", error);
    throw error;
  }
}

export async function notifyAllUsers(message) {
  try {
    const response = await fetch("/api/notification/bulk?type=users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
  } catch (error) {
    console.error("Error notifying users:", error);
    throw error;
  }
}

export async function notifyAllMembers(message) {
  try {
    const response = await fetch("/api/notification/bulk?type=members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.error);
    return result.data;
  } catch (error) {
    console.error("Error notifying members:", error);
    throw error;
  }
}
