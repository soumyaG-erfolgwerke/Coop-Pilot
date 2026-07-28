export const getLogedInUser = async () => {
  try {
    const user = await fetch(`/api/userServices/logedInUser`, {
      method: "GET",
      credentials: "include",
    });
    const data = await user.json();
    return data.user;
  } catch (error) {
    console.error("Error in logedInUserService:", error);
    return null;
  }
};
