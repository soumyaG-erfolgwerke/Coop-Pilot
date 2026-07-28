"use client";
import React, { useState, useEffect } from "react";

import {
  Plus,
  ViewIcon,
  Edit2Icon,
  House,
  Hotel,
  Castle,
  Building2,
  BadgePlus,
} from "lucide-react";

// InputField is now defined locally, so it's removed from this import
import { CreateCoopModal, EditCoopModal } from "./PendingModals.jsx";

import { getPendingCoop } from "@/lib/coopAdminSignUpServices.js";

const PendingCoop = () => {
  const [cooperatives, setCooperatives] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCoop, setSelectedCoop] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const fetchCoops = async () => {
      const allCoops = await getPendingCoop();
      setCooperatives(allCoops || []); // Fallback to mock for display
    };
    fetchCoops();
  }, [reloadKey]);

  const handleOpenEditModal = (coop) => {
    setSelectedCoop(coop);
    setIsEditModalOpen(true);
  };

  const icons = {
    1: House,
    2: Hotel,
    3: Building2,
    4: Castle,
  };

  return (
    <div className="p-6 animate-fadeIn">
      <CreateCoopModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        triggerReload={setReloadKey}
        coop={selectedCoop}
      />
      {isEditModalOpen && (
        <EditCoopModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          coop={selectedCoop}
          triggerReload={setReloadKey}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Pending Onboarding
        </h2>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md dark:bg-slate-800">
        <table className="w-full text-sm">
          <thead className="text-xs text-left text-gray-700 uppercase dark:text-gray-300 bg-gray-50 dark:bg-slate-700">
            <tr>
              <th className="p-4">Cooperative</th>
              <th className="p-4">
                Registration
                <br />
                Number
              </th>
              <th className="p-4">State</th>
              <th className="p-4">Court</th>
              <th className="p-4">Requested by</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cooperatives.map((coop) => {
              const IconComponent = icons[coop.size] || icons[1];

              return (
                <tr
                  key={coop.$id}
                  className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                >
                  <td className="flex items-center p-4 font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center justify-center w-8 h-8 mr-3 text-blue-600 bg-tint rounded-md dark:bg-primary-dark-900/30 dark:text-primary/80">
                      <IconComponent size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold">{coop.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {coop.sector}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">{coop.RegNumber}</td>
                  <td className="p-4">{coop.state}</td>
                  <td className="p-4">{coop.CourtName}</td>
                  <td className="p-4">{coop.adminName}</td>
                  <td className="p-4">
                    {!coop.isAdd ? (
                      <button
                        className="p-1.5 text-gray-500 hover:text-green-600 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600"
                        onClick={() => {
                          setSelectedCoop(coop);
                          setIsCreateModalOpen(true);
                        }}
                        title="Add cooperate"
                      >
                        <BadgePlus size={24} />
                      </button>
                    ) : (
                      <button
                        className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600"
                        onClick={() => handleOpenEditModal(coop)}
                        title="Edit Cooperate"
                      >
                        <Edit2Icon size={24} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PendingCoop;
