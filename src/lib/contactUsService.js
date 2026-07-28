// Client-side service that calls API routes

/**
 * Add a new Contact Us record
 * @param {{ name: string; email: string; text: string; contactNumber?: string }} payload
 */
export const addContactUs = async (payload) => {
  const { name, email, text, contactNumber } = payload ?? {};
  if (!name || !email || !text) {
    throw new Error('name, email, and text are required.');
  }

  try {
    const response = await fetch("/api/contactUs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, text, contactNumber }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to submit contact form");
    }

    return data.document;
  } catch (error) {
    console.error("Error adding contact us submission:", error);
    throw error;
  }
};

/**
 * Get Contact Us list (paginated, newest first)
 * @param {{ limit?: number; offset?: number; search?: string }} opts
 *  - limit: page size (default 25)
 *  - offset: skip count (default 0)
 *  - search: optional free-text search across "text"
 */
export const getAllContactUs = async (opts = {}) => {
  const { limit = 25, offset = 0, search } = opts;

  try {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    params.append("offset", offset.toString());
    if (search && search.trim()) {
      params.append("search", search.trim());
    }

    const response = await fetch(`/api/contactUs?${params.toString()}`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch contact submissions");
    }

    return { total: data.total, documents: data.documents };
  } catch (error) {
    console.error("Error fetching contact us submissions:", error);
    throw error;
  }
};
