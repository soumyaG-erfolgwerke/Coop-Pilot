import React, { useState, useEffect } from "react";
import useUserCache from "../../hooks/useUserCache";
import highlightText from "../ui/highlightText";

const UserEmail = ({ id, email: directEmail, highlight }) => {
  const [email, setEmail] = useState(directEmail || "");
  const { getUserById } = useUserCache();

  useEffect(() => {
    if (directEmail) {
      setEmail((prev) => (prev === directEmail ? prev : directEmail));
    } else if (id) {
      async function getUserEmail() {
        const userDetails = await getUserById(id);
        setEmail(userDetails?.email || "");
      }
      getUserEmail();
    }
  }, [id, directEmail, getUserById]);

  return highlightText(email, highlight);
};

export default UserEmail;
