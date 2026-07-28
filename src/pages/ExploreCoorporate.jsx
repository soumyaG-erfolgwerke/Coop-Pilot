"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  Briefcase,
  MapPin,
  Filter,
  DollarSign,
  Flag,
  Building2,
  SearchX,
  Radio,
  Star,
} from "lucide-react";
import { getAllActivatedCoops } from "../lib/getCoopsService";
import { getAllSectorService } from "../lib/sectorsService";
import { getAllStatesService } from "../lib/statesService";

// Helper to determine sector-based styles and color themes
const getSectorGradient = (sector) => {
  const sec = (sector || "").toLowerCase();
  if (sec.includes("agri") || sec.includes("farm") || sec.includes("land")) {
    return "from-emerald-500/20 to-teal-500/10 dark:from-emerald-500/10 dark:to-teal-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  }
  if (
    sec.includes("finance") ||
    sec.includes("credit") ||
    sec.includes("bank") ||
    sec.includes("money")
  ) {
    return "from-amber-500/20 to-yellow-500/10 dark:from-amber-500/10 dark:to-yellow-500/5 text-amber-600 dark:text-amber-400 border-amber-500/20";
  }
  if (
    sec.includes("energy") ||
    sec.includes("solar") ||
    sec.includes("power")
  ) {
    return "from-cyan-500/20 to-blue-500/10 dark:from-cyan-500/10 dark:to-blue-500/5 text-cyan-600 dark:text-cyan-400 border-cyan-500/20";
  }
  if (
    sec.includes("tech") ||
    sec.includes("software") ||
    sec.includes("digital")
  ) {
    return "from-purple-500/20 to-indigo-500/10 dark:from-purple-500/10 dark:to-indigo-500/5 text-purple-600 dark:text-purple-400 border-purple-500/20";
  }
  return "from-blue-500/20 to-indigo-500/10 dark:from-blue-500/10 dark:to-indigo-500/5 text-blue-600 dark:text-blue-400 border-blue-500/20";
};

// StarRating component (in case needed, preserved for compatibility)
const StarRating = ({ rating }) => {
  const totalStars = 5;
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = totalStars - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <Star
          key={`full-${i}`}
          className="w-4 h-4 text-yellow-400 fill-current"
        />
      ))}
      {halfStar && (
        <Star
          key="half"
          className="w-4 h-4 text-yellow-400 fill-current"
          style={{ clipPath: "inset(0 50% 0 0)" }}
        />
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star
          key={`empty-${i}`}
          className="w-4 h-4 text-gray-300 fill-current dark:text-gray-600"
        />
      ))}
      <span className="ml-1.5 text-xs text-gray-600 dark:text-gray-400">
        ({rating.toFixed(1)})
      </span>
    </div>
  );
};

// CooperativeCard component
const CooperativeCard = ({ cooperative }) => {
  const router = useRouter();
  const gradient = getSectorGradient(cooperative.sector);
  const bannerStyle = cooperative.banner
    ? { backgroundImage: `url(${cooperative.banner})`, backgroundSize: "cover", backgroundPosition: "center" }
    : {};

  return (
    <div className="flex flex-col overflow-hidden bg-white border border-gray-150 dark:bg-slate-800 dark:border-slate-700 rounded-2xl shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 min-h-[380px] animate-scaleIn">
      {/* Decorative Sector Banner */}
      <div
        className={`h-24 bg-gradient-to-r ${gradient} relative flex items-end justify-between px-6 pb-3`}
        style={bannerStyle}
      >
        {/* Status Badge in Top Right */}
        <div className="absolute top-4 right-4">
          {cooperative.isLive ? (
            <span className="flex items-center px-2 py-0.5 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50 rounded-full uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse mr-1.5 shrink-0"></span>
              Live
            </span>
          ) : (
            <span className="flex items-center px-2 py-0.5 text-[9px] font-bold text-gray-450 bg-gray-100 border border-gray-200 dark:bg-slate-700 dark:text-gray-400 dark:border-slate-650 rounded-full uppercase tracking-wider">
              Not Ready Yet
            </span>
          )}
        </div>
      </div>

      {/* Logo container overlapping the banner */}
      <div className="relative z-10 flex items-end justify-between px-6 -mt-9">
        <div className="overflow-hidden bg-white rounded-full shadow-md ring-4 ring-white dark:ring-slate-800 dark:bg-slate-900 shrink-0">
          {cooperative.logo ? (
            <img
              src={cooperative.logo}
              alt={cooperative.name}
              className="object-cover w-16 h-16"
            />
          ) : (
            <div className="flex items-center justify-center w-16 h-16 text-lg font-extrabold text-blue-600 bg-blue-600/10 dark:bg-blue-500/20 dark:text-blue-400">
              {cooperative.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col justify-between flex-grow p-6 pt-4">
        <div>
          <h3 className="mb-1 text-base font-extrabold tracking-wide text-gray-900 dark:text-white line-clamp-1">
            {cooperative.name}
          </h3>
          <p className="text-xs text-gray-555 dark:text-gray-400 leading-relaxed line-clamp-2 font-semibold min-h-[32px] mb-4">
            {cooperative.description ||
              "No description provided for this cooperative."}
          </p>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="p-3 space-y-1 border border-gray-100 dark:border-slate-750 bg-gray-50/30 dark:bg-slate-900/10 rounded-xl">
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                Sector
              </span>
              <span className="text-xs font-bold text-gray-750 dark:text-gray-300 flex items-center gap-1.5 truncate">
                <Briefcase size={13} className="text-blue-500" />
                {cooperative.sector}
              </span>
            </div>

            <div className="p-3 space-y-1 border border-gray-100 dark:border-slate-750 bg-gray-50/30 dark:bg-slate-900/10 rounded-xl">
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                State
              </span>
              <span className="text-xs font-bold text-gray-750 dark:text-gray-300 flex items-center gap-1.5 truncate">
                <MapPin size={13} className="text-emerald-500" />
                {cooperative.state}
              </span>
            </div>

            <div className="p-3 space-y-1 border border-gray-100 dark:border-slate-750 bg-gray-50/30 dark:bg-slate-900/10 rounded-xl">
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                Share Price
              </span>
              <span className="text-xs font-bold text-gray-750 dark:text-gray-300 flex items-center gap-1.5 truncate">
                <DollarSign size={13} className="text-amber-500" />
                {cooperative.sharePrice
                  ? String(cooperative.sharePrice).includes("€") ||
                    String(cooperative.sharePrice).includes("$")
                    ? cooperative.sharePrice
                    : `€${cooperative.sharePrice}`
                  : "N/A"}
              </span>
            </div>

            <div className="p-3 space-y-1 border border-gray-100 dark:border-slate-750 bg-gray-50/30 dark:bg-slate-900/10 rounded-xl">
              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                Country
              </span>
              <span className="text-xs font-bold text-gray-750 dark:text-gray-300 flex items-center gap-1.5 truncate">
                <Flag size={13} className="text-purple-500" />
                {cooperative.country || "N/A"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 mt-6 border-t border-gray-100 dark:border-slate-700/50">
          <button
            disabled={!cooperative.isLive}
            onClick={() => router.push(`/cooperate/${cooperative.id}`)}
            className={`w-full text-xs font-bold py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center shadow-xs ${
              !cooperative.isLive
                ? "bg-gray-100 dark:bg-slate-750 text-gray-400 dark:text-gray-550 cursor-not-allowed border border-transparent"
                : "bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-md shadow-blue-500/10"
            }`}
          >
            {cooperative.isLive ? "View Details" : "Not Ready Yet"}
          </button>
        </div>
      </div>
    </div>
  );
};

// CooperativeCardSkeleton component
const CooperativeCardSkeleton = () => (
  <div className="flex flex-col overflow-hidden bg-white border border-gray-150 dark:bg-slate-800 dark:border-slate-700 rounded-2xl shadow-xs min-h-[380px] animate-pulse">
    <div className="h-24 bg-gray-100 dark:bg-slate-750" />
    <div className="relative z-10 px-6 -mt-9">
      <div className="w-16 h-16 bg-gray-200 rounded-full dark:bg-slate-700 ring-4 ring-white dark:ring-slate-800" />
    </div>
    <div className="flex flex-col justify-between flex-grow p-6 pt-4">
      <div className="space-y-4">
        <div className="w-3/4 h-4 rounded-md bg-gray-200 dark:bg-slate-700" />
        <div className="space-y-2">
          <div className="w-full h-3 rounded-md bg-gray-150 dark:bg-slate-700/60" />
          <div className="w-5/6 h-3 rounded-md bg-gray-150 dark:bg-slate-700/60" />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="h-10 bg-gray-100 dark:bg-slate-750 rounded-xl" />
          <div className="h-10 bg-gray-100 dark:bg-slate-750 rounded-xl" />
          <div className="h-10 bg-gray-100 dark:bg-slate-750 rounded-xl" />
          <div className="h-10 bg-gray-100 dark:bg-slate-750 rounded-xl" />
        </div>
      </div>
      <div className="pt-4 mt-6 border-t border-gray-100 dark:border-slate-700/50">
        <div className="w-full bg-gray-200 h-9 dark:bg-slate-700 rounded-xl" />
      </div>
    </div>
  </div>
);

function ExploreCorporate() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All Sectors");
  const [selectedRegion, setSelectedRegion] = useState("All States");
  const [sectors, setSectors] = useState([]);
  const [states, setStates] = useState([]);
  const [allCooperatives, setallCooperatives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dropdown data and cooperatives
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [sectorsData, statesData, allCoops] = await Promise.all([
          getAllSectorService(),
          getAllStatesService(),
          getAllActivatedCoops(),
        ]);
        setSectors([{ name: "All Sectors", key: "all" }, ...sectorsData]);
        setStates([{ statename: "All States", sid: "all" }, ...statesData]);
        setallCooperatives(allCoops);
      } catch (err) {
        toast.error("Failed to load cooperatives data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const totalCoops = allCooperatives.length;
    const totalSectors = Math.max(0, sectors.length - 1);
    const totalRegions = Math.max(0, states.length - 1);
    const liveCoops = allCooperatives.filter((coop) => coop.isLive).length;

    return {
      totalCoops,
      totalSectors,
      totalRegions,
      liveCoops,
    };
  }, [allCooperatives, sectors, states]);

  const filteredCooperatives = useMemo(() => {
    return allCooperatives.filter((coop) => {
      const nameMatch = coop.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const sectorMatch = coop.sector
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const typeMatch =
        selectedType === "All Sectors" || coop.sector === selectedType;
      const regionMatch =
        selectedRegion === "All States" || coop.state === selectedRegion;

      return (nameMatch || sectorMatch) && typeMatch && regionMatch;
    });
  }, [allCooperatives, searchTerm, selectedType, selectedRegion]);

  return (
    <div className="min-h-screen p-4 text-gray-900 bg-gray-50/50 dark:bg-slate-900 dark:text-white sm:p-6 lg:p-8 font-inter animate-fadeIn">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="max-w-4xl mx-auto mt-4 mb-10 text-center">
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300 bg-clip-text">
            Explore Cooperatives
          </h1>
          <p className="max-w-xl mx-auto text-sm font-semibold leading-relaxed text-gray-500 dark:text-gray-450">
            Discover and join verified cooperatives powering democratic
            ownership, community development, and sustainable impact.
          </p>
        </div>

        {/* Quick Stats Summary Bar */}
        <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
          <div className="flex items-center gap-4 p-5 transition-all bg-white border shadow-xs border-gray-150 dark:bg-slate-800 dark:border-slate-700 rounded-2xl hover:shadow-sm">
            <div className="p-3 text-blue-500 rounded-xl bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400">
              <Building2 size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider block">
                Total Cooperatives
              </span>
              <span className="text-lg font-extrabold text-gray-900 dark:text-white mt-0.5 block">
                {isLoading ? "..." : stats.totalCoops}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 transition-all bg-white border shadow-xs border-gray-150 dark:bg-slate-800 dark:border-slate-700 rounded-2xl hover:shadow-sm">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-400">
              <Briefcase size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider block">
                Active Sectors
              </span>
              <span className="text-lg font-extrabold text-gray-900 dark:text-white mt-0.5 block">
                {isLoading ? "..." : stats.totalSectors}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 transition-all bg-white border shadow-xs border-gray-150 dark:bg-slate-800 dark:border-slate-700 rounded-2xl hover:shadow-sm">
            <div className="flex items-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 dark:text-emerald-450">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse mr-1"></span>
              <Radio size={16} className="ml-1" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider block">
                Live & Verified
              </span>
              <span className="text-lg font-extrabold text-gray-900 dark:text-white mt-0.5 block">
                {isLoading ? "..." : stats.liveCoops}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 p-5 transition-all bg-white border shadow-xs border-gray-150 dark:bg-slate-800 dark:border-slate-700 rounded-2xl hover:shadow-sm">
            <div className="p-3 text-purple-500 rounded-xl bg-purple-50 dark:bg-purple-950/20 dark:text-purple-450">
              <MapPin size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-555 uppercase tracking-wider block">
                Regions covered
              </span>
              <span className="text-lg font-extrabold text-gray-900 dark:text-white mt-0.5 block">
                {isLoading ? "..." : stats.totalRegions}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="p-6 mb-10 transition-all border shadow-xs bg-white/60 dark:bg-slate-800/60 border-gray-150 dark:border-slate-700/50 backdrop-blur-md rounded-2xl hover:shadow-sm">
          <div className="grid items-end grid-cols-1 gap-5 md:grid-cols-3">
            {/* Search Input */}
            <div className="md:col-span-1">
              <label
                htmlFor="search"
                className="block mb-2 text-xs font-bold tracking-wider uppercase text-gray-450 dark:text-gray-500"
              >
                Search by name or sector
              </label>
              <div className="relative shadow-xs rounded-xl">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Search className="w-4 h-4 text-gray-400 dark:text-gray-555" />
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="E.g., GreenEnergy Co-op..."
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-900 text-gray-805 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:ring-blue-500/30 dark:focus:border-blue-500 sm:text-xs font-bold transition-all duration-200"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label
                htmlFor="typeFilter"
                className="block mb-2 text-xs font-bold tracking-wider uppercase text-gray-455 dark:text-gray-500"
              >
                Filter by Type
              </label>
              <div className="relative shadow-xs rounded-xl">
                <select
                  id="typeFilter"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="block w-full pl-3.5 pr-10 py-2.5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-850 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:ring-blue-500/30 dark:focus:border-blue-500 sm:text-xs font-bold appearance-none transition-all duration-200"
                >
                  {sectors.map((type) => (
                    <option key={type.name} value={type.name}>
                      {type.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute w-4 h-4 text-gray-405 -translate-y-1/2 pointer-events-none dark:text-gray-500 right-3.5 top-1/2" />
              </div>
            </div>

            {/* Region Filter */}
            <div>
              <label
                htmlFor="regionFilter"
                className="block mb-2 text-xs font-bold tracking-wider uppercase text-gray-455 dark:text-gray-500"
              >
                Filter by Region
              </label>
              <div className="relative shadow-xs rounded-xl">
                <select
                  id="regionFilter"
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="block w-full pl-3.5 pr-10 py-2.5 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-850 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:ring-blue-500/30 dark:focus:border-blue-500 sm:text-xs font-bold appearance-none transition-all duration-200"
                >
                  {states.map((region) => (
                    <option key={region.sid} value={region.statename}>
                      {region.statename}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute w-4 h-4 text-gray-405 -translate-y-1/2 pointer-events-none dark:text-gray-500 right-3.5 top-1/2" />
              </div>
            </div>
          </div>
        </div>

        {/* Cooperatives Grid / Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {[...Array(6)].map((_, i) => (
              <CooperativeCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredCooperatives.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {filteredCooperatives.map((coop) => (
              <CooperativeCard key={coop.id} cooperative={coop} />
            ))}
          </div>
        ) : (
          <div className="max-w-xl py-16 mx-auto text-center bg-white border shadow-xs select-none border-gray-150 dark:bg-slate-800 dark:border-slate-700 rounded-2xl">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-gray-400 rounded-full bg-slate-50 dark:bg-slate-900/40 dark:text-gray-550">
              <SearchX size={32} />
            </div>
            <h3 className="mb-2 text-sm font-extrabold tracking-wide text-gray-800 uppercase dark:text-gray-200">
              No cooperatives found
            </h3>
            <p className="max-w-sm px-6 mx-auto text-xs font-semibold leading-relaxed text-gray-500 dark:text-gray-450">
              We couldn't find any cooperatives matching your current search
              term or filter selection.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedType("All Sectors");
                setSelectedRegion("All States");
              }}
              className="mt-6 inline-flex items-center gap-1.5 px-4.5 py-2.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:hover:bg-blue-950/40 border border-transparent rounded-xl transition-all shadow-xs"
            >
              Reset Search & Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExploreCorporate;
