// Client-side service - uses API routes for mail operations

/**
 * 1. Fetch potential recipients based on their role.
 */
export const getRecipientsByRole = async (role) => {
  try {
    const res = await fetch(`/api/mail/recipients?role=${encodeURIComponent(role)}`);
    const data = await res.json();
    return data.recipients || [];
  } catch (error) {
    console.error(`Failed to fetch ${role}s:`, error);
    return [];
  }
};

/**
 * 2. Send Email AND Save to Appwrite
 */
export const sendMailService = async (mailData) => {
  try {
    const res = await fetch("/api/mail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mailData),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error);
    return { record: data.record, mailResponse: data.mailResponse };
  } catch (error) {
    console.error("Mail Service Error:", error);
    throw error;
  }
};

/**
 * 3. Fetch Mails for Inbox/Sent views
 */
export const getMailsService = async (userId, type = "received") => {
  try {
    const res = await fetch(`/api/mail?userId=${encodeURIComponent(userId)}&type=${encodeURIComponent(type)}`);
    const data = await res.json();
    return data.mails || [];
  } catch (error) {
    console.error("Failed to fetch mails:", error);
    return [];
  }
};