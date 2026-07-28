// Client-side service - uses API route for password recovery operations

export async function createRecovery(email) {
  try {
    const res = await fetch("/api/forget-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return { status: data.status, message: data.message };
  } catch (error) {
    console.error("Error creating recovery:", error);
    return { status: 500, message: "Error creating recovery" };
  }
}

export async function updatePassword(
  userId,
  secret,
  newPassword,
  captchaToken,
) {
  try {
    const res = await fetch("/api/forget-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, secret, newPassword, captchaToken }),
    });
    const data = await res.json();
    return { status: data.status, message: data.message };
  } catch (error) {
    console.error("Error updating password:", error);
    return { status: 500, message: "Error updating password" };
  }
}
