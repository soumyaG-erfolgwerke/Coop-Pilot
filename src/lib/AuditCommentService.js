// Client-side service that calls API routes

export const addAuditComment = async ({
  coopid,
  commentText,
  submittedBy,
  submissionType,
}) => {
  try {
    const response = await fetch("/api/auditServices/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        coopid,
        commentText,
        submittedBy,
        submissionType,
      }),
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to add comment");
    }

    return data.comment;
  } catch (error) {
    console.error("Error adding new comment:", error);
    throw error;
  }
};

export const getAuditCommentsByCoopId = async (coopid) => {
  try {
    const response = await fetch(`/api/auditServices/comment?coopid=${coopid}`, {
      method: "GET",
      credentials: "include",
    });

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch comments");
    }

    return {
      coopid: data.coopid,
      totalComments: data.totalComments,
      comments: data.comments,
    };
  } catch (error) {
    console.error("Error fetching comments:", error);
    throw error;
  }
};
