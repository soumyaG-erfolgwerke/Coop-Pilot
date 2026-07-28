"use client";

import { useRef } from "react";
import {
  getAllCoops as getAllCoopsService,
  getCoopById as getCoopByIdService,
} from "../lib/getCoopsService";

const LOCAL_STORAGE_KEY = "appwriteCoopMap";

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

const useCoopCache = () => {
  const coopMapRef = useRef(new Map());

  const loadAllCoopsToCache = async () => {
    try {
      const allCoops = await getAllCoopsService(); // should return [{ id, name, ... }]
      const map = new Map();

      allCoops?.forEach((coop) => {
        const item = {
          id: coop.id,
          name: coop.name,
          sector: coop.sector,
          status: coop.status,
          state: coop.state,
          country: coop.country,
          logo: coop.logo,
          auditStatus: coop.auditStatus,
        };
        map.set(coop.id, item);
      });

      coopMapRef.current = map;
      // console.log(JSON.stringify(Object.fromEntries(map)))
      safeLocalStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(Object.fromEntries(map))
      );
    } catch (err) {
      console.error("❌ Failed to load cooperatives:", err);
    }
  };

  const getCoopById = async (coopId) => {
    // console.log('getCoopById', coopId)
    // 1) In-memory
    if (coopMapRef.current.has(coopId)) {
      return coopMapRef.current.get(coopId);
    }

    // 2) localStorage
    const cached = safeLocalStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = new Map(Object.entries(JSON.parse(cached)));
      if (parsed.has(coopId)) {
        coopMapRef.current = parsed;
        return parsed.get(coopId);
      }
    }

    // 3) API
    try {
      const coop = await getCoopByIdService(coopId);
      if (!coop) throw new Error("Not found");
      const item = {
        id: coop.id,
        name: coop.name ?? "Unknown Cooperative",
        sector: coop.sector,
        status: coop.status,
        state: coop.state,
        country: coop.country,
        logo: coop.logo,
        auditStatus: coop.auditStatus,
      };
      coopMapRef.current.set(coopId, item);
      safeLocalStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(Object.fromEntries(coopMapRef.current))
      );
      return item;
    } catch (err) {
      return {
        id: coopId,
        name: "Unknown Cooperative",
        sector: null,
        status: null,
        state: null,
        country: null,
        logo: null,
        auditStatus: null,
      };
    }
  };

  const getAllCoops = async () => {
    if (coopMapRef.current.size > 0) {
      return Array.from(coopMapRef.current.values());
    }

    const cached = safeLocalStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = new Map(Object.entries(JSON.parse(cached)));
      if (parsed.size > 0) {
        coopMapRef.current = parsed;
        return Array.from(parsed.values());
      }
    }

    await loadAllCoopsToCache();
    return Array.from(coopMapRef.current.values());
  };

  const getAllCoopNames = async () => {
    const coops = await getAllCoops();
    return coops.map((c) => ({
      id: c.id,
      name: c.name ?? "Unknown Cooperative",
    }));
  };

  const getCoopNameById = async (coopId) => {
    const coop = await getCoopById(coopId);
    return coop?.name ?? "Unknown Cooperative";
  };

  return {
    loadAllCoopsToCache,
    getCoopById,
    getAllCoops,
    getAllCoopNames,
    getCoopNameById,
  };
};

export default useCoopCache;

