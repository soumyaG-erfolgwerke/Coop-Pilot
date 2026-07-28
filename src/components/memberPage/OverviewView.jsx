"use client";
import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getCoopsOfMembers } from "../../lib/transactionService";
import { TrendingUp, User, Building, Layers, Euro, Phone, Mail, Hash, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#10b981",
];

const OverviewView = ({ memberId }) => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const coops = await getCoopsOfMembers(memberId);
        setData(coops);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (memberId) fetchData();
  }, [memberId]);

  const totals = useMemo(() => {
    const totalShares = data.reduce((sum, c) => sum + c.totalShares, 0);
    const totalPrice = data.reduce((sum, c) => sum + c.totalPrice, 0);
    return { totalShares, totalPrice };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 mx-auto space-y-8 max-w-7xl">
      <motion.div
        className="p-6 bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-2xl"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 pb-4 mb-6 border-b border-gray-100 dark:border-slate-700">
          <div className="p-3 text-indigo-600 rounded-full bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              {user?.name || "Member Profile"}
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">Personal Details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Member No", val: user?.userId, icon: Hash },
            { label: "Email", val: user?.email, icon: Mail },
            { label: "Telephone", val: user?.telephoneNo, icon: Phone },
          ].map((item, i) => (
            <div key={i} className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl">
              <div className="flex items-center gap-2 mb-1 text-sm text-gray-500 dark:text-slate-400">
                <item.icon className="w-4 h-4" /> {item.label}
              </div>
              <p className="font-semibold text-gray-900 truncate dark:text-slate-200">{item.val || "—"}</p>
            </div>
          ))}
          <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl">
            <div className="flex items-center gap-2 mb-1 text-sm text-gray-500 dark:text-slate-400">
              <Activity className="w-4 h-4" /> Status
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 capitalize">
              {user?.status || "Active"}
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="relative p-6 overflow-hidden transition-shadow bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-2xl group hover:shadow-md">
          <div className="absolute top-0 right-0 p-4 transition-opacity opacity-10 group-hover:opacity-20">
            <Layers className="w-24 h-24 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="mb-1 text-sm font-medium text-gray-500 dark:text-slate-400">Total Shares</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-slate-100">
            {totals.totalShares.toLocaleString()}
          </p>
        </div>

        <div className="relative p-6 overflow-hidden transition-shadow bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-2xl group hover:shadow-md">
          <div className="absolute top-0 right-0 p-4 transition-opacity opacity-10 group-hover:opacity-20">
            <Euro className="w-24 h-24 text-green-600 dark:text-green-400" />
          </div>
          <p className="mb-1 text-sm font-medium text-gray-500 dark:text-slate-400">Total Capital</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-slate-100">
            €{totals.totalPrice.toLocaleString({ minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="relative p-6 overflow-hidden transition-shadow bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-2xl group hover:shadow-md">
          <div className="absolute top-0 right-0 p-4 transition-opacity opacity-10 group-hover:opacity-20">
            <Building className="w-24 h-24 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="mb-1 text-sm font-medium text-gray-500 dark:text-slate-400">Cooperatives</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-slate-100">
            {data.length}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <motion.div
          className="p-6 bg-white border border-gray-100 shadow-sm lg:col-span-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 text-purple-600 rounded-lg bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
              Overview Analytics
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
            {/* Shares Chart */}
            <div className="flex flex-col items-center">
              <h4 className="mb-4 text-sm font-medium tracking-wider text-gray-500 uppercase dark:text-slate-400">Shares Distribution</h4>
              <div className="w-full md:h-[420px] lg:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="totalShares"
                      nameKey="name"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={2}
                      label={{ fill: '#888888', fontSize: 12 }}
                    >
                      {data.map((entry, index) => (
                        <Cell key={entry.coopId} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }}
                      itemStyle={{ color: '#f1f5f9' }}
                      formatter={(value) => value.toLocaleString()} 
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <h4 className="mb-4 text-sm font-medium tracking-wider text-gray-500 uppercase dark:text-slate-400">Capital Distribution</h4>
              <div className="w-full md:h-[420px] lg:h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="totalPrice"
                      nameKey="name"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={2}
                      label={{ fill: '#888888', fontSize: 12 }}
                    >
                      {data.map((entry, index) => (
                        <Cell key={entry.coopId} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f1f5f9' }}
                      itemStyle={{ color: '#f1f5f9' }}
                      formatter={(v) => `€${v.toLocaleString({ minimumFractionDigits: 2 })}`} 
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="flex flex-col p-6 bg-white border border-gray-100 shadow-sm dark:bg-slate-800 dark:border-slate-700 rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 text-blue-600 rounded-lg bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400">
              <Building className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
              My Cooperatives
            </h3>
          </div>

          {data.length === 0 ? (
            <div className="flex items-center justify-center flex-1 italic text-gray-400">
              No cooperatives found.
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[400px]">
              {data.map((coop, index) => (
                <div
                  key={coop.coopId}
                  className="flex flex-col p-4 transition-colors border border-gray-100 group dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-900/40 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:border-indigo-100 dark:hover:border-indigo-900/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900 transition-colors dark:text-slate-200 group-hover:text-indigo-900 dark:group-hover:text-indigo-300">
                      {coop.name}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400">
                      #{index + 1}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex flex-col">
                      <span className="text-xs tracking-wider text-gray-500 uppercase dark:text-slate-500">Shares</span>
                      <span className="font-medium text-gray-700 dark:text-slate-300">{coop.totalShares.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-xs tracking-wider text-gray-500 uppercase dark:text-slate-500">Capital</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        €{coop.totalPrice.toLocaleString({ minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
};

export default OverviewView;