"use client";

import React, { useState, useEffect } from "react";
import ProfilePage from "./ProfilePage";
import MailDashboard from "@/components/mail/MailDashboard";
import {
  Shield,
  Building2,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  MoreHorizontal,
  Mail,
  Trash2,
  Edit,
  X,
  Upload,
  DollarSign,
  CheckCircle,
  Sun,
  Moon,
  AlignLeft,
  Bot,
  Crown,
  MapPin,
  Briefcase,
  Send,
  UserPlus,
  ViewIcon,
  Edit2Icon,
  Copy,
  AlertTriangle,
  Camera,
} from "lucide-react";
import { createCoopAdmin } from "../lib/addMemberService.js"; // <-- Adjust this path
import { allUsersService } from "../lib/allUsersService.js";
// InputField is now defined locally, so it's removed from this import
import {
  EditUserModal,
  Modal,
  CreateCoopModal,
  CreateUserModal,
  MessageModal,
  EditCoopModal,
  InputField,
} from "../components/superadmin/modals.jsx";
import { RoleBadge, StatusBadge } from "../theme/Themes.jsx";
import { SuperAdminSidebar } from "../components/superadmin/SuperAdminSidebar.jsx";
import { getAllCoops } from "../lib/getCoopsService.js"; // Assuming getCoopById is also here
import { useRouter } from "next/navigation";
import PendingCoop from "@/components/superadmin/PendingCoop";
import ContactUsTable from "../components/superadmin/ContactUsTable.jsx";
import MessagesView from "../components/superadmin/MessagesView.jsx";
import { useRoleDashboardTab } from "@/hooks/useRoleDashboardTab";
import ProfileUpdatePage from "@/components/superadmin/ProfileUpdatePage";

const SUPER_ADMIN_TAB_MAP = {
  dashboard: "Dashboard",
  cooperatives: "Cooperatives",
  users: "Users",
  messages: "Messages",
  "pending-cooperatives": "PendingCooperatives",
  contacts: "Contacts",
  mails: "Mails",
  profile: "Profile",
  update: "Update"
};

// // --- MOCK API (for demonstration as real API is not available here) ---
// const mockUpdateCoop = async (coopId, data) => {
//     console.log(`MOCK API: Updating coop ${coopId} with data:`, data);
//     return new Promise(resolve => setTimeout(() => resolve({ success: true, data: { ...data, id: coopId } }), 500));
// };

// const mockDeleteCoop = async (coopId) => {
//     console.log(`MOCK API: Deleting coop ${coopId}`);
//     return new Promise(resolve => setTimeout(() => resolve({ success: true }), 500));
// };
// const mockUploadFile = async (file) => {
//     console.log(`MOCK API: "Uploading" file: ${file.name}`);
//     // In a real app, this would upload to a service and return a URL.
//     // Here, we'll just return a placeholder URL for demonstration.
//     return new Promise(resolve => setTimeout(() => resolve(`https://cdn.example.com/${Date.now()}-${file.name}`), 1000));
// };

// // --- MOCK DATA ---
// const mockCooperatives = [
//     { id: 'coop-001', name: 'GreenEnergy Co-op', sector: 'Energy', admin: 'jane.doe@example.com', members: 1200, status: 'Active', country: 'Germany', regNumber: 'VR 12345', CourtName: 'Berlin Charlottenburg', sharePrice: 100, logo: 'https://placehold.co/400x400/2ECC71/FFFFFF?text=G', banner: 'https://placehold.co/1200x400/A9D5A5/FFFFFF?text=GreenEnergy' },
//     { id: 'coop-002', name: 'FarmFresh Agri', sector: 'Agriculture', admin: 'john.smith@example.com', members: 600, status: 'Active', country: 'France', regNumber: 'AG 54321', CourtName: 'Paris', sharePrice: 50, logo: 'https://placehold.co/400x400/E67E22/FFFFFF?text=F', banner: 'https://placehold.co/1200x400/FAD7A0/FFFFFF?text=FarmFresh' },
// ];

// const mockUsers = [
//     { id: 'user-01', name: 'Jane Doe', email: 'jane.doe@example.com', role: 'Admin', coop: 'GreenEnergy Co-op', status: 'Active' },
// ];

// --- CONTENT VIEWS ---
const CooperativesView = ({ onCoopCreate }) => {
  const [cooperatives, setCooperatives] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCoop, setSelectedCoop] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchCoops = async () => {
      const allCoops = await getAllCoops();
      setCooperatives(allCoops || []); // Fallback to mock for display
    };
    fetchCoops();
  }, [reloadKey]);

  const handleOpenEditModal = (coop) => {
    setSelectedCoop(coop);
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-6 animate-fadeIn">
      <CreateCoopModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        triggerReload={setReloadKey}
        onSave={onCoopCreate}
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
          Manage Cooperatives
        </h2>{" "}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center px-4 py-2 text-sm text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700"
        >
          <Plus size={16} className="mr-2" /> Create New Cooperative
        </button>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md dark:bg-slate-800">
        <table className="w-full text-sm">
          <thead className="text-xs text-left text-gray-700 uppercase dark:text-gray-300 bg-gray-50 dark:bg-slate-700">
            <tr>
              <th className="p-4">Cooperative</th>
              <th className="p-4">State</th>
              <th className="p-4">Court</th>
              <th className="p-4">Share price</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cooperatives.map((coop) => (
              <tr
                key={coop.id}
                className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
              >
                <td className="flex items-center p-4 font-medium text-gray-900 dark:text-white">
                  <img
                    src={coop.logo}
                    alt="logo"
                    className="w-8 h-8 mr-3 rounded-md"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold">{coop.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {coop.sector}
                    </span>
                  </div>
                </td>
                <td className="p-4">{coop.state}</td>
                <td className="p-4">{coop.CourtName}</td>
                <td className="p-4">{coop.sharePrice}€</td>
                <td className="p-4">
                  <StatusBadge status={coop.status} />
                </td>
                <td className="p-4">
                  <button
                    className="p-1.5 text-gray-500 hover:text-green-600 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600"
                    onClick={() => router.push(`/cooperate/${coop.id}`)}
                    title="View cooperate"
                  >
                    <ViewIcon size={16} />
                  </button>
                  <button
                    className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600"
                    onClick={() => handleOpenEditModal(coop)}
                    title="Edit Cooperate"
                  >
                    <Edit2Icon size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const UsersView = ({ onCreateUser }) => {
  const [reloadKey, setReloadKey] = useState(0);
  const [users, setUsers] = useState([]);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isloading, setIsloading] = useState(true);

  const SkeletonRow = () => (
    <tr className="border-b dark:border-slate-700">
      <td className="p-4">
        <div className="space-y-2">
          <div className="w-3/4 h-4 bg-gray-200 rounded dark:bg-slate-700 animate-pulse"></div>
          <div className="w-1/2 h-3 bg-gray-200 rounded dark:bg-slate-700 animate-pulse"></div>
        </div>
      </td>
      <td className="p-4">
        <div className="w-20 h-5 bg-gray-200 rounded-full dark:bg-slate-700 animate-pulse"></div>
      </td>
      <td className="p-4">
        <div className="w-20 h-5 bg-gray-200 rounded-full dark:bg-slate-700 animate-pulse"></div>
      </td>
      <td className="p-4">
        <div className="flex space-x-2">
          <div className="w-6 h-6 bg-gray-200 rounded-full dark:bg-slate-700 animate-pulse"></div>
          <div className="w-6 h-6 bg-gray-200 rounded-full dark:bg-slate-700 animate-pulse"></div>
          <div className="w-6 h-6 bg-gray-200 rounded-full dark:bg-slate-700 animate-pulse"></div>
        </div>
      </td>
    </tr>
  );

  const UsersViewSkeleton = () => {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Manage Users
          </h2>
          <button
            disabled
            className="flex items-center px-4 py-2 text-sm text-white bg-primary/80 rounded-lg shadow-md cursor-not-allowed dark:bg-primary-dark-800"
          >
            <Plus size={16} className="mr-2" /> Create New User
          </button>
        </div>
        <div className="overflow-x-auto bg-white rounded-lg shadow-md dark:bg-slate-800">
          <table className="w-full text-sm">
            <thead className="text-xs text-left text-gray-700 uppercase dark:text-gray-300 bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  useEffect(() => {
    setIsloading(true);
    const fetchUsers = async () => {
      const users = await allUsersService();
      setUsers(users);
    };
    setIsloading(false);
    fetchUsers();
  }, [reloadKey]);

  const rerunEffect = () => setReloadKey(Date.now());

  const handleSendMessage = (user) => {
    setSelectedUser(user);
    setIsMessageModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = (updatedUser) => {
    // console.log("User update data:", updatedUser);
    setUsers(
      users.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    );
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  if (isloading) {
    return UsersViewSkeleton();
  } else {
    return (
      <div className="p-6 animate-fadeIn">
        <MessageModal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          user={selectedUser}
        />
        <CreateUserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={onCreateUser}
          reRender={rerunEffect}
        />
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={selectedUser}
          onUpdateUser={handleUpdateUser}
        />

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Manage Users
          </h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center px-4 py-2 text-sm text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700"
          >
            <Plus size={16} className="mr-2" /> Create New User
          </button>
        </div>
        <div className="overflow-x-auto bg-white rounded-lg shadow-md dark:bg-slate-800">
          <table className="w-full text-sm">
            <thead className="text-xs text-left text-gray-700 uppercase dark:text-gray-300 bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                >
                  <td className="p-4 font-medium text-gray-900 dark:text-white">
                    {user.name}
                    <p className="text-xs font-normal text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </td>
                  <td className="p-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="p-4">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="p-4 space-x-1">
                    <button
                      onClick={() => handleSendMessage(user)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600"
                      title="Send Message"
                    >
                      <Mail size={16} />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(user)}
                      className="p-1.5 text-gray-500 hover:text-green-600 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600"
                      title="Edit User"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="p-1.5 text-gray-500 hover:text-red-600 rounded-full hover:bg-gray-100 dark:hover:bg-slate-600"
                      title="Delete User"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
};

// --- MAIN SUPER ADMIN PAGE ---
const SuperAdminPage = () => {
  const { activeView, setActiveView } = useRoleDashboardTab(
    SUPER_ADMIN_TAB_MAP,
    "Cooperatives"
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleCreateCoop = (newCoopData) => {
    // console.log("Creating new cooperative:", newCoopData); //Todo: create the coop api call
  };

  const handleCreateUser = async (newUserData) => {
    // console.log("Creating new user via parent:", newUserData);
    const result = await createCoopAdmin(newUserData);
    if (result.success) {
      alert(
        `Successfully created user ${newUserData.firstName} ${newUserData.lastName}`
      );
    } else {
      alert(`Failed to create user: ${result.error.message}`);
    }
    return result;
  };

  const renderView = () => {
    switch (activeView) {
      case "Cooperatives":
        return <CooperativesView onCoopCreate={handleCreateCoop} />;
      case "Users":
        return <UsersView onCreateUser={handleCreateUser} />;
      case "Messages":
        return <MessagesView />;
      case "PendingCooperatives":
        return <PendingCoop />;
      case "Contacts":
        return <ContactUsTable />;
      case "Mails":
        return <MailDashboard />;
      case "Profile":
        return <ProfilePage />;
      case "Update":
        return <ProfileUpdatePage />;
      default:
        return (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {activeView} (Placeholder)
            </h2>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-900 font-inter">
      <SuperAdminSidebar
        activeView={activeView}
        setActiveView={setActiveView}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <main
        className={`flex-1 overflow-y-auto transition-all duration-300 ${
          isSidebarOpen ? "md:ml-64" : "md:ml-20"
        }`}
      >
        {renderView()}
      </main>
    </div>
  );
};

export default SuperAdminPage;
