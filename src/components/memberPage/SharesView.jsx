"use client";
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  PieChart as PieIcon,
  Euro,
  Tag,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#10b981",
];

export default function SharesView({ coops = [] }) {
  const [sortConfig, setSortConfig] = useState({
    key: "totalPrice",
    direction: "desc", 
  });

  const totals = useMemo(() => {
    const totalShares = coops.reduce((sum, c) => sum + c.totalShares, 0);
    const totalPrice = coops.reduce((sum, c) => sum + c.totalPrice, 0);
    return { totalShares, totalPrice };
  }, [coops]);

  const avgBuyPrice =
    totals.totalShares > 0 ? totals.totalPrice / totals.totalShares : 0;

  const selectedCoopName =
    coops.length === 1 ? coops[0].name : "All Cooperatives";

  const sortedCoops = useMemo(() => {
    let sortableItems = coops.map((c) => ({
      ...c,
      boughtPrice: c.totalShares > 0 ? c.totalPrice / c.totalShares : 0,
    }));

    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [coops, sortConfig]);

  const sortingHandler = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400 transition-opacity opacity-50 dark:text-slate-500 group-hover:opacity-100" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
    ) : (
      <ArrowDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
    );
  };

  if (!coops.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-gray-400 italic dark:text-slate-500">
        No shares found.
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto space-y-8 max-w-7xl">
      <div className="flex items-center gap-3 pb-1">
        <div className="p-3 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Meine Anteile</h2>
          <p className="text-sm text-gray-500 dark:text-slate-400">{selectedCoopName}</p>
        </div>
      </div>

      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 p-6 transition-shadow bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-2xl hover:shadow-md">
          <div className="p-4 text-blue-600 rounded-full bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400">
            <PieIcon className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Shares</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">
              {totals.totalShares.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-6 transition-shadow bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-2xl hover:shadow-md">
          <div className="p-4 text-green-600 rounded-full bg-green-50 dark:bg-green-900/30 dark:text-green-400">
            <Euro className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Capital</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">
              €
              {totals.totalPrice.toLocaleString({
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-6 transition-shadow bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-2xl hover:shadow-md">
          <div className="p-4 text-purple-600 rounded-full bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400">
            <Tag className="w-8 h-8" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Avg Buy Price</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-slate-100">
              €
              {avgBuyPrice.toLocaleString({
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="p-6 bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-slate-100">
          Portfolio Distribution
        </h3>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-col items-center">
            <h4 className="mb-2 text-sm font-medium tracking-wider text-gray-500 uppercase dark:text-slate-400">
              By Shares
            </h4>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={coops}
                    dataKey="totalShares"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    label={{ fill: '#888888', fontSize: 12 }}
                  >
                    {coops.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => value.toLocaleString()}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9', boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.3)" }}
                    itemStyle={{ color: '#f1f5f9' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <h4 className="mb-2 text-sm font-medium tracking-wider text-gray-500 uppercase dark:text-slate-400">
              By Capital (€)
            </h4>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={coops}
                    dataKey="totalPrice"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    label={{ fill: '#888888', fontSize: 12 }}
                  >
                    {coops.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      `€${value.toLocaleString({
                        minimumFractionDigits: 2,
                      })}`
                    }
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9', boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.3)" }}
                    itemStyle={{ color: '#f1f5f9' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="p-6 bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-2xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="mb-6 text-xl font-semibold text-gray-900 dark:text-slate-100">
          Share Details
        </h3>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-sm text-left text-gray-600 dark:text-slate-300 whitespace-nowrap">
            <thead className="text-xs text-gray-500 uppercase border-b border-gray-100 select-none dark:text-slate-400 bg-gray-50 dark:bg-slate-900/50 dark:border-slate-700">
              <tr>
                <th 
                  className="px-6 py-4 font-semibold transition-colors rounded-tl-lg cursor-pointer group hover:bg-gray-100 dark:hover:bg-slate-700/50"
                  onClick={() => sortingHandler("name")}
                >
                  <div className="flex items-center gap-2">
                    Cooperative <SortIcon columnKey="name" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 font-semibold transition-colors cursor-pointer group hover:bg-gray-100 dark:hover:bg-slate-700/50"
                  onClick={() => sortingHandler("totalShares")}
                >
                  <div className="flex items-center justify-end gap-2">
                    <SortIcon columnKey="totalShares" /> Shares
                  </div>
                </th>
                <th 
                  className="px-6 py-4 font-semibold transition-colors cursor-pointer group hover:bg-gray-100 dark:hover:bg-slate-700/50"
                  onClick={() => sortingHandler("totalPrice")}
                >
                  <div className="flex items-center justify-end gap-2">
                    <SortIcon columnKey="totalPrice" /> Capital
                  </div>
                </th>
                <th 
                  className="px-6 py-4 font-semibold transition-colors cursor-pointer group hover:bg-gray-100 dark:hover:bg-slate-700/50"
                  onClick={() => sortingHandler("boughtPrice")}
                >
                  <div className="flex items-center justify-end gap-2">
                    <SortIcon columnKey="boughtPrice" /> Bought Price
                  </div>
                </th>
                {/* <th className="px-6 py-4 font-semibold text-center rounded-tr-lg">
                  Current Price
                </th> */}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              <AnimatePresence>
                {sortedCoops.map((c) => (
                  <motion.tr
                    key={c.coopId}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-slate-700/30"
                    layout 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-slate-100">
                      {c.name}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {c.totalShares.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-right text-green-600 dark:text-green-400">
                      €
                      {c.totalPrice.toLocaleString({
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 font-medium text-right text-indigo-600 dark:text-indigo-400">
                      €
                      {c.boughtPrice.toLocaleString({
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    {/* <td className="px-6 py-4 italic text-center text-gray-400 dark:text-slate-500">
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-slate-700 rounded-full text-xs">
                        Available soon
                      </span>
                    </td> */}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}