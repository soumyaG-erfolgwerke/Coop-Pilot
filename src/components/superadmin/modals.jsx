"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
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
  Copy,
  AlertTriangle,
  Camera,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  createMember,
  createCoopAdmin,
  createSuperAdmin,
  createAuditer,
  createAuditerEmployee,
  createAuditerTrainee,
} from "../../lib/addMemberService.js"; // <-- Adjust this path
import {
  allUsersService,
  getPotentialAdmins,
} from "../../lib/allUsersService.js";
import { RoleBadge, StatusBadge } from "../../theme/Themes.jsx";
import {
  createCooperative,
  updateCoopStatus,
  updateCooperativeById,
} from "../../lib/addCoopService.js";
import { getAllCoops, getCoopById } from "../../lib/getCoopsService.js";
import { getAllSectorService } from "../../lib/sectorsService.js";
import { getAllStatesService } from "../../lib/statesService.js";

// --- HELPER & GENERIC COMPONENTS ---
export const InputField = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  required,
  colSpan = "sm:col-span-1",
  children,
}) => (
  <div className={colSpan}>
    <label
      htmlFor={id}
      className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {type === "select" ? (
        <select
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          className={`mt-1 block w-full py-2.5 px-3 border ${
            error ? "border-red-500" : "border-gray-300 dark:border-slate-600"
          } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${
            error ? "focus:ring-red-500" : "focus:ring-primary"
          } sm:text-sm`}
        >
          {children}
        </select>
      ) : (
        <input
          type={type}
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`mt-1 block w-full py-2.5 px-3 border ${
            error ? "border-red-500" : "border-gray-300 dark:border-slate-600"
          } bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 ${
            error ? "focus:ring-red-500" : "focus:ring-primary"
          } sm:text-sm`}
        />
      )}
    </div>
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
);

// A simple reusable Modal component structure
export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl dark:bg-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            &times;
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

export const EditUserModal = ({ isOpen, onClose, user, onUpdateUser }) => {
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");

  // Pre-fill the form with the selected user's data when the modal opens
  useEffect(() => {
    if (user) {
      setRole(user.role);
      setStatus(user.status);
    }
  }, [user]);

  const handleUpdate = () => {
    // Here you would typically call an API to update the user
    // For now, it just calls the passed-in function
    onUpdateUser({ ...user, role, status });
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit ${user.name}`}>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="role-select"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Role
          </label>
          <select
            id="role-select"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white dark:focus:ring-primary dark:focus:border-primary"
          >
            {/* These options should ideally come from a config or API */}
            <option value="coopadmin">Admin</option>
            <option value="member">Member</option>
            <option value="superuser">Super Admin</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="status-select"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Status
          </label>
          <select
            id="status-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-slate-700 dark:border-slate-600 dark:placeholder-slate-400 dark:text-white dark:focus:ring-primary dark:focus:border-primary"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end mt-6 space-x-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-slate-600 dark:text-white dark:hover:bg-slate-500"
        >
          Cancel
        </button>
        <button
          onClick={handleUpdate}
          className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700"
        >
          Update User
        </button>
      </div>
    </Modal>
  );
};

export const CreateCoopModal = ({ isOpen, onClose, onSave, triggerReload }) => {
  const [formData, setFormData] = useState({
    name: "",
    sector: "",
    country: "",
    state: "",
    regNumber: "",
    court: "",
    sharePrice: "",
    admins: [],
    logo: null,
    bannerImage: null,
    about: "",
  });
  const [availableAdmins, setAvailableAdmins] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // State for dropdown options
  const [sectors, setSectors] = useState([]);
  const [states, setStates] = useState([]);

  // Fetch static dropdown data only once when the component mounts
  useEffect(() => {
    async function fetchData() {
      try {
        const sectorsData = await getAllSectorService();
        const statesData = await getAllStatesService();
        setSectors(sectorsData);
        setStates(statesData);
      } catch (error) {
        console.error("Failed to fetch dropdown data", error);
        toast.error("Could not load necessary data.");
      }
    }
    fetchData();
  }, []);

  // Fetch dynamic data (like users) only when the modal is opened
  useEffect(() => {
    if (isOpen) {
      const fetchAdmins = async () => {
        try {
          const users = await getPotentialAdmins();
          setAvailableAdmins(users);
        } catch (error) {
          console.error("Failed to fetch admins", error);
        }
      };
      fetchAdmins();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files.length > 0) {
      setFormData({ ...formData, [name]: files[0] });
    }
  };

  const handleAdminChange = (adminEmail) => {
    setFormData((prevFormData) => {
      const newAdmins = prevFormData.admins.includes(adminEmail)
        ? prevFormData.admins.filter((email) => email !== adminEmail)
        : [...prevFormData.admins, adminEmail];
      return { ...prevFormData, admins: newAdmins };
    });
  };

  const validate = () => {
    /* Add validation logic */ return true;
  };

  const handleSave = () => {
    if (isSaving) return;
    if (validate()) {
      setIsSaving(true);
      const creationPromise = createCooperative(formData);

      toast.promise(creationPromise, {
        loading: "Creating your cooperative...",
        success: (newCoop) => {
          onSave(newCoop);
          onClose();
          triggerReload(Date.now());
          setIsSaving(false);
          return "Cooperative created successfully!";
        },
        error: (err) => {
          setIsSaving(false);
          return err.message || "There was a problem creating the cooperative.";
        },
      });
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fadeIn">
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 transform bg-white shadow-2xl dark:bg-slate-800 rounded-xl animate-scaleUp">
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Create New Cooperative
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <X />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <InputField
              id="name"
              label="Cooperative Name"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
              colSpan="sm:col-span-2"
            />

            {/* --- SECTOR DROPDOWN --- */}
            <div>
              <label
                htmlFor="sector"
                className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Sector <span className="text-red-500">*</span>
              </label>
              <select
                id="sector"
                name="sector"
                value={formData.sector}
                onChange={handleChange}
                className="mt-1 block w-full py-2.5 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm"
              >
                <option value="" disabled>
                  -- Select a Sector --
                </option>
                {sectors.map((sector) => (
                  <option key={sector.key} value={sector.name}>
                    {sector.name}
                  </option>
                ))}
              </select>
              {errors.sector && (
                <p className="mt-1 text-xs text-red-500">{errors.sector}</p>
              )}
            </div>

            <InputField
              id="country"
              label="Country"
              value={formData.country}
              onChange={handleChange}
              error={errors.country}
              required
            />

            {/* --- STATE/PROVINCE DROPDOWN --- */}
            <div>
              <label
                htmlFor="state"
                className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                State/Province <span className="text-red-500">*</span>
              </label>
              <select
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="mt-1 block w-full py-2.5 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm"
              >
                <option value="" disabled>
                  -- Select a State --
                </option>
                {states.map((state) => (
                  <option key={state.sid} value={state.statename}>
                    {state.statename}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="mt-1 text-xs text-red-500">{errors.state}</p>
              )}
            </div>

            <InputField
              id="regNumber"
              label="Registration Number"
              value={formData.regNumber}
              onChange={handleChange}
              error={errors.regNumber}
              required
            />
            <InputField
              id="court"
              label="Registration Court"
              value={formData.court}
              onChange={handleChange}
              error={errors.court}
              required
            />
            <InputField
              id="sharePrice"
              label="Share Price (€)"
              type="number"
              value={formData.sharePrice}
              onChange={handleChange}
              error={errors.sharePrice}
              required
            />

            <div className="sm:col-span-2">
              <label
                htmlFor="about"
                className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                About Cooperative
              </label>
              <textarea
                id="about"
                name="about"
                rows="4"
                value={formData.about}
                onChange={handleChange}
                placeholder="Provide a brief description..."
                className="mt-1 block w-full py-2.5 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                Assign Admins
              </label>
              <div className="flex flex-wrap gap-2 p-2 mt-2 border border-gray-300 rounded-md dark:border-slate-600">
                {availableAdmins.length > 0 ? (
                  availableAdmins.map((admin) => {
                    const isSelected = formData.admins.includes(admin.email);
                    return (
                      <button
                        key={admin.$id}
                        type="button"
                        onClick={() => handleAdminChange(admin.email)}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white dark:bg-slate-700 dark:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-600"
                        }`}
                      >
                        {admin.name} ({admin.email})
                      </button>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500">
                    No available admins to select.
                  </p>
                )}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="logo"
                className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Logo Image
              </label>
              <input
                name="logo"
                type="file"
                id="logo"
                onChange={handleFileChange}
                className="block w-full mt-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-tint dark:file:bg-blue-900/50 dark:file:text-blue-300 dark:hover:file:bg-blue-800/50"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="bannerImage"
                className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Banner Image
              </label>
              <input
                name="bannerImage"
                type="file"
                id="bannerImage"
                onChange={handleFileChange}
                className="block w-full mt-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-tint dark:file:bg-blue-900/50 dark:file:text-blue-300 dark:hover:file:bg-blue-800/50"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end p-6 border-t bg-gray-50 dark:bg-slate-800/50 dark:border-slate-700 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 mr-3 text-sm border rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              "Creating..."
            ) : (
              <>
                <Plus size={16} className="mr-1.5" /> Create Cooperative
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const CreateUserModal = ({ isOpen, onClose, onSave, reRender }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    salutation: "",
    title: "",
    role: "Member",
    cooperativeId: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        salutation: "",
        title: "",
        role: "Member",
        cooperativeId: "",
      });
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const emptyForm = () =>
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      salutation: "",
      title: "",
      role: "Member",
      cooperativeId: "",
    });

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = "First name is required.";
    if (!formData.lastName) newErrors.lastName = "Last name is required.";
    if (!formData.email) newErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format.";
    if (!formData.password || formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters.";
    if (!formData.role) newErrors.role = "Role is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    // console.log("creating user", formData.role);

    if (validate()) {
      if (formData.role == "coopadmin") {
        const result = await createCoopAdmin(formData);
        // console.log(result);
        if (result.success) {
          emptyForm();
          onClose();
          reRender();
        } else {
          setErrors({
            form: result.error?.message || "Failed to create user.",
          });
        }
      } else if (formData.role == "superuser") {
        const result = await createSuperAdmin(formData);
        // console.log(result);
        if (result.success) {
          emptyForm();
          onClose();
          reRender();
        } else {
          setErrors({
            form: result.error?.message || "Failed to create user.",
          });
        }
      } else if (formData.role == "auditer") {
        const result = await createAuditer(formData);
        // console.log(result);
        if (result.success) {
          emptyForm();
          onClose();
          reRender();
        } else {
          setErrors({
            form: result.error?.message || "Failed to create user.",
          });
        }
      } else if (formData.role == "auditerE") {
        const result = await createAuditerEmployee(formData);
        // console.log(result);
        if (result.success) {
          emptyForm();
          onClose();
          reRender();
        } else {
          setErrors({
            form: result.error?.message || "Failed to create user.",
          });
        }
      } else if (formData.role == "auditerT") {
        const result = await createAuditerTrainee(formData);
        // console.log(result);
        if (result.success) {
          emptyForm();
          onClose();
          reRender();
        } else {
          setErrors({
            form: result.error?.message || "Failed to create user.",
          });
        }
      }
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fadeIn">
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 transform bg-white shadow-2xl dark:bg-slate-800 rounded-xl animate-scaleUp">
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Create New User
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <X />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <InputField
              id="salutation"
              label="Salutation"
              type="select"
              value={formData.salutation}
              onChange={handleChange}
              error={errors.salutation}
            >
              <option value="">None</option>
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Ms.">Ms.</option>
            </InputField>
            <InputField
              id="title"
              label="Title"
              value={formData.title}
              onChange={handleChange}
              error={errors.title}
              placeholder="e.g., Dr."
            />
            <InputField
              id="firstName"
              label="First Name"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
              required
            />
            <InputField
              id="lastName"
              label="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
              required
            />
            <InputField
              id="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
              colSpan="sm:col-span-2"
            />
            <InputField
              id="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />
            <InputField
              id="role"
              label="Role"
              type="select"
              value={formData.role}
              onChange={handleChange}
              error={errors.role}
              required
            >
              {/* <option value="member">Member</option> */}
              <option value="coopadmin">Admin</option>
              <option value="superuser">Super Admin</option>
              <option value="auditer">Auditer Manager</option>
              <option value="auditerE">Auditer</option>
              <option value="auditerT">Auditer Trainee</option>
            </InputField>

            {errors.form && (
              <p className="text-sm text-red-500 sm:col-span-2">
                {errors.form}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end p-6 border-t bg-gray-50 dark:bg-slate-800/50 dark:border-slate-700 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 mr-3 text-sm border rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <UserPlus size={16} className="mr-1.5" /> Create User
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const MessageModal = ({ isOpen, onClose, user }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/60 animate-fadeIn">
      <div className="w-full max-w-lg transition-all duration-300 transform bg-white shadow-2xl dark:bg-slate-800 rounded-xl animate-scaleUp">
        <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Send Message to {user.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <X />
          </button>
        </div>
        <div className="p-6">
          <InputField
            id="subject"
            label="Subject"
            placeholder="Regarding your account..."
            colSpan="sm:col-span-2"
          />
          <div className="mt-4">
            <label
              htmlFor="message"
              className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Message
            </label>
            <textarea
              id="message"
              rows="4"
              className="mt-1 block w-full py-2.5 px-3 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm"
            ></textarea>
          </div>
        </div>
        <div className="flex justify-end p-6 border-t bg-gray-50 dark:bg-slate-800/50 dark:border-slate-700 rounded-b-xl">
          <button
            onClick={onClose}
            className="flex items-center px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <Mail size={16} className="mr-1.5" /> Send Message
          </button>
        </div>
      </div>
    </div>
  );
};

// --- HELPER COMPONENT FOR INPUT FIELDS ---
// Defining this locally to ensure it's a proper controlled component and fix the editing issue.
const InputField2 = ({
  name,
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  colSpan,
  className,
}) => (
  <div className={`${colSpan || ""} ${className || ""}`.trim()}>
    {label && (
      <label
        htmlFor={name}
        className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
    )}
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm dark:border-slate-600 dark:bg-slate-700 focus:outline-none focus:ring-primary sm:text-sm"
    />
  </div>
);

// --- HELPER COMPONENT FOR IMAGE UPLOADS ---
const ImageUploadField = ({ label, imageUrl, onFileChange }) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(imageUrl);

  useEffect(() => {
    setPreview(imageUrl);
  }, [imageUrl]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
        onFileChange(file);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="md:col-span-2">
      <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="flex items-center mt-2 space-x-6">
        <div className="shrink-0">
          {preview ? (
            <img
              className="object-cover w-20 h-20 bg-gray-100 rounded-md"
              src={preview}
              alt="Current"
            />
          ) : (
            <div className="flex items-center justify-center w-20 h-20 bg-gray-100 rounded-md dark:bg-slate-700">
              <Camera className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          className="px-3 py-2 text-sm font-semibold text-gray-900 bg-white rounded-md shadow-sm dark:bg-slate-700 dark:text-gray-200 ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600"
        >
          Replace
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/png, image/jpeg, image/gif"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
};

// --- HELPER COMPONENT FOR ADMIN MULTI-SELECT ---
const MultiSelectAdmins = ({ options, selectedEmails, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (email) => {
    const newSelection = selectedEmails.includes(email)
      ? selectedEmails.filter((item) => item !== email)
      : [...selectedEmails, email];
    onChange(newSelection);
  };

  const selectedAdmins = options.filter((opt) =>
    selectedEmails.includes(opt.email)
  );

  return (
    <div className="relative md:col-span-2">
      <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
        Cooperative Admins
      </label>
      <div className="mt-1">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-full py-2 pl-3 pr-10 text-left bg-white border border-gray-300 rounded-md shadow-sm cursor-default dark:border-slate-600 dark:bg-slate-700 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
        >
          <div className="flex flex-wrap gap-2">
            {selectedAdmins.length > 0 ? (
              selectedAdmins.map((admin) => (
                <span
                  key={admin.$id || admin.email}
                  className="inline-flex items-center gap-x-1.5 rounded-md bg-tint dark:bg-primary-dark-800/50 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300"
                >
                  {admin.name}
                </span>
              ))
            ) : (
              <span className="text-gray-500 dark:text-gray-400">
                Select Admins...
              </span>
            )}
          </div>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 ml-3 pointer-events-none">
            <ChevronRight
              className={`h-5 w-5 text-gray-400 transition-transform ${
                isOpen ? "rotate-90" : ""
              }`}
              aria-hidden="true"
            />
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full py-1 mt-1 overflow-auto text-base bg-white rounded-md shadow-lg max-h-56 dark:bg-slate-700 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {options.map((admin) => (
              <div
                key={admin.$id || admin.email}
                onClick={() => handleSelect(admin.email)}
                className="relative py-2 pl-3 text-gray-900 cursor-default select-none pr-9 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600"
              >
                <div className="flex items-center">
                  <span className="block ml-3 font-normal truncate">
                    {admin.name}{" "}
                    <span className="text-gray-500 dark:text-gray-400">
                      ({admin.email})
                    </span>
                  </span>
                </div>
                {selectedEmails.includes(admin.email) && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600 dark:text-primary/80">
                    <CheckCircle className="w-5 h-5" aria-hidden="true" />
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const EditCoopModal = ({ isOpen, onClose, coop, triggerReload }) => {
  const [formData, setFormData] = useState({});
  const [logoFile, setLogoFile] = useState(coop?.logo || null);
  const [bannerFile, setBannerFile] = useState(coop?.banner || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmId, setConfirmId] = useState("");
  const [error, setError] = useState("");
  const [availableAdmins, setAvailableAdmins] = useState([]);
  const [sectors, setSectors] = useState([]);
  const [states, setStates] = useState([]);
  const idRef = useRef(null);


  // Fetch dropdown data once
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        const sectorsData = await getAllSectorService();
        const statesData = await getAllStatesService();
        setSectors(sectorsData);
        setStates(statesData);
      } catch (err) {
        toast.error("Failed to load dropdown options");
        console.error(err);
      }
    };
    fetchDropdowns();
  }, []);

  // Load coop details when modal opens
  useEffect(() => {
    if (isOpen && coop) {
      const fetchDetails = async () => {
        setIsLoading(true);
        try {
          const coopDetails = await getCoopById(coop.id);
          const admins = await getPotentialAdmins();
          if (coopDetails) {
            coopDetails.adminEmails = coopDetails.adminEmails || [];
            setFormData(coopDetails);
            setAvailableAdmins(admins);
          } else {
            setError("Could not load cooperative details");
          }
        } catch (err) {
          console.error(err);
          setError("Error loading cooperative");
        } finally {
          setIsLoading(false);
        }
      };
      fetchDetails();
    } else {
      setFormData({});
      setLogoFile(null);
      setBannerFile(null);
      setConfirmId("");
    }
  }, [isOpen, coop]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdminChange = (emails) => {
    setFormData((prev) => ({ ...prev, adminEmails: emails }));
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    const { id, ...payload } = formData;

    try {
      await updateCooperativeById(coop.id, {
        ...payload,
        logoFile,
        bannerFile,
      });
      triggerReload(Date.now());
      onClose();
    } catch (err) {
      alert(`Failed to update: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (status) => {
    setIsSaving(true);
    try {
      await updateCoopStatus(coop.id, status);
      setFormData((prev) => ({ ...prev, status }));
      triggerReload(Date.now());
    } catch (err) {
      alert(`Failed to change status: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirmId !== coop.id) {
      alert("ID mismatch — deletion cancelled.");
      return;
    }
    setIsSaving(true);
    try {
      await deleteCooperativeById(coop.id);
      triggerReload(Date.now());
      onClose();
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    if (idRef.current) {
      navigator.clipboard
        .writeText(idRef.current.innerText)
        .then(() => alert("Co-op ID copied to clipboard!"))
        .catch((err) => console.error("Clipboard error:", err));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Cooperative
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 rounded-full hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto">
          {isLoading ? (
            <div className="py-20 text-center">Loading...</div>
          ) : error ? (
            <div className="py-20 text-center text-red-500">{error}</div>
          ) : (
            <>
              {/* Coop ID */}
              <div className="flex items-center justify-between p-3 mb-6 bg-gray-100 rounded-lg dark:bg-slate-700">
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Cooperative ID
                  </span>
                  <p
                    ref={idRef}
                    className="font-mono text-sm text-gray-800 dark:text-gray-200"
                  >
                    {coop.id}
                  </p>
                </div>
                <button
                  onClick={copyToClipboard}
                  title="Copy ID"
                  className="p-2 text-gray-500 rounded-full hover:text-blue-600 hover:bg-gray-200 dark:hover:bg-slate-600"
                >
                  <Copy size={16} />
                </button>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <ImageUploadField
                  label="Logo"
                  imageUrl={formData.logo}
                  onFileChange={setLogoFile}
                />
                <ImageUploadField
                  label="Banner"
                  imageUrl={formData.banner}
                  onFileChange={setBannerFile}
                />
                <InputField2
                  name="name"
                  label="Cooperative Name"
                  value={formData.name || ""}
                  onChange={handleChange}
                />

                {/* Sector Dropdown */}
                <div>
                  <label
                    htmlFor="sector"
                    className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Sector
                  </label>
                  <select
                    name="sector"
                    id="sector"
                    value={formData.sector || ""}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm dark:border-slate-600 dark:bg-slate-700 sm:text-sm"
                  >
                    <option value="">-- Select Sector --</option>
                    {Array.isArray(sectors) &&
                      sectors.map((sector) => (
                        <option key={sector.$id || sector.name} value={sector.key}>
                          {sector.name}
                        </option>
                      ))}
                  </select>
                </div>

                <MultiSelectAdmins
                  options={availableAdmins}
                  selectedEmails={formData.adminEmails || []}
                  onChange={handleAdminChange}
                />

                {/* State Dropdown */}
                <div>
                  <label
                    htmlFor="state"
                    className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    State
                  </label>
                  <select
                    name="state"
                    id="state"
                    value={formData.state || ""}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm dark:border-slate-600 dark:bg-slate-700 sm:text-sm"
                  >
                    <option value="">-- Select State --</option>
                    {Array.isArray(states) &&
                      states.map((state) => (
                        <option key={state.sid} value={state.statename}>
                          {state.statename}
                        </option>
                      ))}
                  </select>
                </div>

                <InputField2
                  name="country"
                  label="Country"
                  value={formData.country || ""}
                  onChange={handleChange}
                />
                <InputField2
                  name="CourtName"
                  label="Court of Registration"
                  value={formData.CourtName || ""}
                  onChange={handleChange}
                />
                <InputField2
                  name="regNumber"
                  label="Registration Number"
                  value={formData.regNumber || ""}
                  onChange={handleChange}
                />
                <InputField2
                  name="sharePrice"
                  label="Share Price ($)"
                  type="number"
                  value={formData.sharePrice || ""}
                  onChange={handleChange}
                />
              </div>

              {/* Description */}
              <div className="mt-4">
                <label
                  htmlFor="description"
                  className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows="4"
                  value={formData.description || ""}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm dark:border-slate-600 dark:bg-slate-700 sm:text-sm"
                ></textarea>
              </div>

              {/* Status & Delete */}
              <div className="pt-6 mt-8 space-y-6 border-t border-gray-200 dark:border-slate-700">
                <div>
                  <h3 className="mb-2 font-semibold text-gray-800 text-md dark:text-gray-200">
                    Manage Status
                  </h3>
                  <div className="flex items-center space-x-4">
                    <p>
                      Current Status: <StatusBadge status={formData.status} />
                    </p>
                    {formData.status === "active" ? (
                      <button
                        onClick={() => handleStatusChange("inactive")}
                        disabled={isSaving}
                        className="px-4 py-2 text-white bg-yellow-500 rounded-md shadow-sm disabled:bg-yellow-300"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStatusChange("active")}
                        disabled={isSaving}
                        className="px-4 py-2 text-white bg-green-600 rounded-md shadow-sm disabled:bg-green-300"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-4 border-l-4 border-red-500 rounded-r-lg bg-red-50 dark:bg-red-900/20">
                  <h3 className="flex items-center font-semibold text-red-700 text-md dark:text-red-400">
                    <AlertTriangle size={18} className="mr-2" /> Danger Zone
                  </h3>
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400/80">
                    Paste the cooperative ID below to delete. This cannot be
                    undone.
                  </p>
                  <InputField2
                    name="confirmId"
                    placeholder="Paste Cooperative ID to confirm"
                    value={confirmId}
                    onChange={(e) => setConfirmId(e.target.value)}
                    className="mt-2"
                  />
                  <button
                    onClick={handleDelete}
                    disabled={confirmId !== coop.id || isSaving}
                    className="w-full px-4 py-2 mt-3 text-white bg-red-600 rounded-md shadow-sm disabled:bg-red-300 disabled:cursor-not-allowed"
                  >
                    Permanently Delete Cooperative
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 mr-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-slate-600 dark:text-gray-200 dark:border-slate-500"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={isSaving || isLoading}
            className="px-6 py-2 text-sm text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};
