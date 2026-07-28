"use client";
import React, { useState, useEffect } from "react";
import { Info, Search, MoreHorizontal, Loader } from "lucide-react";
import { getMembersOfCoop } from "../../lib/transactionService"; // adjust path
import UserName from "../userComponent/UserName";

export default function MembersView({ coopId }) {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!coopId || coopId === "None") return;

    const fetchMembers = async () => {
      setLoading(true);
      try {
        const result = await getMembersOfCoop(coopId);
        // console.log("members", result);
        setMembers(result);
      } catch (err) {
        console.error(err);
        setError("Failed to load members.");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [coopId]);

  const filteredDirectory = members.filter((member) => {
    const term = searchTerm.toLowerCase();
    return (
      member.userId?.toLowerCase().includes(term) ||
      member.membername?.toLowerCase().includes(term)
    );
  });

  if (!coopId || coopId === "None") {
    return (
      <div className="p-6 m-6 bg-white rounded-lg shadow-md dark:bg-slate-800 animate-fadeIn">
        <p className="text-center text-gray-500 dark:text-gray-400">
          Please select a cooperative to view its members.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 animate-fadeIn">
      <div className="flex flex-col items-start justify-between mb-6 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Member Directory
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Connect with other cooperative members.
          </p>
        </div>
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://gdpr-info.eu/"
          className="flex items-center mt-3 text-sm text-blue-600 sm:mt-0 dark:text-primary/80 hover:underline"
        >
          <Info size={16} className="mr-1.5" /> GDPR Info
        </a>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute w-5 h-5 text-gray-400 -translate-y-1/2 left-3 top-1/2 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search members by ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary dark:focus:ring-primary/80 focus:border-primary dark:focus:border-primary/80 transition-shadow"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-md dark:bg-slate-800">
        {loading ? (
          <p className="flex items-center justify-center gap-2 py-8 text-center text-gray-500 dark:text-gray-400">
            <Loader className="inline-block w-5 h-5 ml-2 text-gray-400 animate-spin dark:text-gray-500" />
            Loading members...
          </p>
        ) : error ? (
          <p className="py-8 text-center text-red-500">{error}</p>
        ) : filteredDirectory.length === 0 ? (
          <p className="py-8 text-center text-gray-500 dark:text-gray-400">
            No members found.
          </p>
        ) : (
          <table className="w-full text-sm text-left text-gray-500 min-w-max dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase dark:text-gray-300 bg-gray-50 dark:bg-slate-700">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Member ID
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  Shares
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  Price
                </th>
                {/* <th scope="col" className="px-6 py-3 text-center">
                  Actions
                </th> */}
              </tr>
            </thead>
            <tbody>
              {filteredDirectory.map((member) => (
                <tr
                  key={member.userId}
                  className="transition-colors duration-150 bg-white border-b dark:bg-slate-800 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                >
                  <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {/* {member.userId} */}
                    <UserName
                      id={member.userId}
                      name={member.membername}
                      highlight={searchTerm}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">{member.totalShares}</td>
                  <td className="px-6 py-4 text-right">{member.totalPrice}</td>
                  {/* <td className="px-6 py-4 text-center">
                    <button className="p-1 text-blue-600 dark:text-primary/80 hover:text-blue-primary dark:hover:text-blue-300">
                      <MoreHorizontal size={18} />
                    </button>
                  </td> */}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && !error && (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredDirectory.length} of {members.length} members.
        </div>
      )}
    </div>
  );
}
