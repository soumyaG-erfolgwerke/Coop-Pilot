"use client";

import { useEffect, useRef } from "react";
import {
  allUsersService,
  getAllActiveMembersService,
  getUserByIdService,
} from "../lib/allUsersService";

const LOCAL_STORAGE_KEY = "appwriteUserMap";

// Helper to safely access localStorage
const safeLocalStorage = {
  getItem: (key) => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(key);
    }
    return null;
  },
  setItem: (key, value) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(key, value);
    }
  },
};

const useUserCache = () => {
  const userMapRef = useRef(new Map());

  const loadAllUsersToCache = async () => {
    try {
      const allUsers = await allUsersService();
      const map = new Map();
      // console.log(allUsers)
      allUsers.forEach((user) => {
        const userObj = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          kycStatus: user.kycStatus || "PENDING",
        };
        map.set(user.id, userObj);
      });

      userMapRef.current = map;
      safeLocalStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(Object.fromEntries(map))
      );
      console.log("✅ User cache loaded to localStorage");
    } catch (err) {
      console.error("❌ Failed to load users:", err);
    }
  };

  const getUserById = async (userId) => {
    // 1. In-memory check
    if (userMapRef.current.has(userId)) {
      return userMapRef.current.get(userId);
    }

    // 2. LocalStorage check
    const cached = safeLocalStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const raw = JSON.parse(cached);

      // Build a Map regardless of how it was stored previously
      let parsedMap;

      if (Array.isArray(raw)) {
        // legacy: array of users -> use their `id` as key
        parsedMap = new Map(
          raw
            .filter((item) => item && item.id != null)
            .map((item) => [String(item.id), item])
        );
      } else if (raw && typeof raw === "object") {
        // expected: object keyed by id
        parsedMap = new Map(Object.entries(raw));
      } else {
        parsedMap = new Map();
      }

      const key = String(userId); // ensure consistent string keys
      userMapRef.current = parsedMap;

      if (parsedMap.has(key)) {
        return parsedMap.get(key);
      }
    }

    // 3. Fetch and cache
    try {
      const user = await getUserByIdService(userId);
      const userObj = {
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        kycStatus: user.kycStatus || "PENDING",
      };
      userMapRef.current.set(userId, userObj);
      safeLocalStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(Object.fromEntries(userMapRef.current))
      );
      return userObj;
    } catch (err) {
      // console.error(`❌ Couldn’t fetch user ${userId}:`, err);
      return {
        name: "null",
        email: "null",
        role: "null",
        status: "null",
        kycStatus: "PENDING",
      };
    }
  };
  const getAllUsers = async () => {
    // 1. In-memory check
    if (userMapRef.current.size > 0) {
      return Array.from(userMapRef.current.values());
    }

    // 2. LocalStorage check
    const cached = safeLocalStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = new Map(Object.entries(JSON.parse(cached)));
      if (parsed.size > 0) {
        userMapRef.current = parsed;
        return Array.from(parsed.values());
      }
    }

    // 3. Fetch all users if caches are empty
    await loadAllUsersToCache();
    return Array.from(userMapRef.current.values());
  };

  const refreshUser = async (userId) => {
    try {
      // Force fetch fresh data from server
      const user = await getUserByIdService(userId);
      const userObj = {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        kycStatus: user.kycStatus || "PENDING",
      };

      // Update memory cache
      userMapRef.current.set(userId, userObj);

      // Update localStorage
      const cached = safeLocalStorage.getItem(LOCAL_STORAGE_KEY);
      const map = cached ? new Map(Object.entries(JSON.parse(cached))) : new Map();
      map.set(userId, userObj);
      safeLocalStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(Object.fromEntries(map))
      );

      return userObj;
    } catch (err) {
      console.error(`❌ Failed to refresh user cache for ${userId}:`, err);
      return null;
    }
  };

  return { loadAllUsersToCache, getUserById, getAllUsers, refreshUser };
};

export default useUserCache;

