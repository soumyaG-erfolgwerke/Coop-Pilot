"use client";
import React, { useState, useEffect } from 'react';
import useUserCache from '../../hooks/useUserCache';

const getInitials = (name) => {
  if (!name) return '';
  const parts = name.split(' ');
  return (parts[0][0] || '') + (parts[1]?.[0] || '');
};

const UserAvatar = ({ id, name: directName, showName = true, size = 40 }) => {
  const [user, setUser] = useState(directName ? { name: directName } : null);
  const { getUserById } = useUserCache();

  useEffect(() => {
    if (directName) {
      setUser((prev) => {
        if (prev?.name === directName) return prev;
        return { name: directName };
      });
    } else if (id) {
      const fetchUser = async () => {
        const userDetails = await getUserById(id);
        setUser(userDetails);
      };
      fetchUser();
    }
  }, [id, directName, getUserById]);

  const initials = getInitials(user?.name);
  const avatarUrl = `https://placehold.co/${size}x${size}/007bff/ffffff?text=${initials}`;

  return (
    <div className="flex items-center gap-2 mx-2">
      <img
        src={avatarUrl}
        alt={user?.name || "User Avatar"}
        width={size}
        height={size}
        className="rounded-full object-cover"
      />
    </div>
  );
};

export default UserAvatar;
