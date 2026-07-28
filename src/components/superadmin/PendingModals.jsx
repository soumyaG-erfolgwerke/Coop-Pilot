"use client";
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import {
  ChevronRight,
  Plus,
  X,
  CheckCircle,
  Copy,
  AlertTriangle,
  Camera,
} from "lucide-react";
import toast from "react-hot-toast";

// import {
//   createMember,
//   createCoopAdmin,
//   createSuperAdmin,
//   createAuditer,
//   createAuditerEmployee,
// } from "../../api/addMemberService.js"; // <-- Adjust this path
import { getPotentialAdmins } from "../../lib/allUsersService.js";

import {
  createCooperative,
  updateCooperativeById,
} from "../../lib/addCoopService.js";

import { getCoopByRegNumber } from "@/lib/getCoopsService.js";
import { getAllSectorService } from "../../lib/sectorsService.js";
import { getAllStatesService } from "../../lib/statesService.js";
import { approveCoopPlatformRegistry } from "@/lib/coopAdminSignUpServices.js";

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
  disabled = false,
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
      disabled={disabled}
      className={`block w-full px-3 py-2 mt-1 bg-white border border-gray-300 rounded-md shadow-sm dark:border-slate-600 dark:bg-slate-700 focus:outline-none focus:ring-primary sm:text-sm ${
        disabled
          ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-slate-800 font-semibold italic"
          : ""
      }`}
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
              selectedAdmins.map((admin) => {
                const isVerified = admin.isVerified !== false;
                return (
                  <span
                    key={admin.id}
                    className={`inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium ${
                      isVerified
                        ? "bg-tint dark:bg-primary-dark-800/50 text-blue-700 dark:text-blue-300"
                        : "bg-red-100 dark:bg-red-800/50 text-red-700 dark:text-red-300"
                    }`}
                  >
                    {admin.name}
                  </span>
                );
              })
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
            {options.map((admin) => {
              const isVerified = admin.isVerified !== false;
              return (
                <div
                  key={admin.id}
                  onClick={() => handleSelect(admin.email)}
                  className={`relative py-2 pl-3 cursor-default select-none pr-9 hover:bg-gray-100 dark:hover:bg-slate-600 ${
                    isVerified
                      ? "text-gray-900 dark:text-gray-200"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  <div className="flex items-center">
                    <span className="block ml-3 font-normal truncate">
                      {admin.name}{" "}
                      <span
                        className={
                          isVerified
                            ? "text-gray-500 dark:text-gray-400"
                            : "text-red-500 dark:text-red-400"
                        }
                      >
                        ({admin.email})
                      </span>
                    </span>
                  </div>
                  {selectedEmails.includes(admin.email) && (
                    <span
                      className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                        isVerified
                          ? "text-blue-600 dark:text-primary/80"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      <CheckCircle className="w-5 h-5" aria-hidden="true" />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const CreateCoopModal = ({ isOpen, onClose, triggerReload, coop }) => {
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

  // Track if form has been populated to avoid resetting on admin changes
  const formPopulatedRef = useRef(false);

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
      formPopulatedRef.current = false; // Reset flag when modal opens
    }
  }, [isOpen]);

  // Populate form with coop data separately after admins are loaded
  useEffect(() => {
    if (isOpen && availableAdmins.length > 0 && !formPopulatedRef.current) {
      // Populate form with coop data if available
      if (coop) {
        // Helper function to find matching state
        const findMatchingState = (coopState) => {
          if (!coopState) return "";

          // Find state in dropdown that matches coop.state
          const matchedState = states.find((state) => {
            const stateName = state.statename;
            // Check if coopState matches full name, name without brackets, or German name in brackets
            if (stateName === coopState) return true;

            // Extract parts: "Thuringia (Thüringen)" -> ["Thuringia", "Thüringen"]
            const match = stateName.match(/^([^(]+?)(?:\s*\(([^)]+)\))?$/);
            if (match) {
              const englishName = match[1].trim();
              const germanName = match[2]?.trim();

              return (
                coopState === englishName ||
                coopState === germanName ||
                coopState === `${englishName} (${germanName})`
              );
            }
            return false;
          });

          return matchedState ? matchedState.statename : coopState;
        };

        // Helper function to find matching admins by name or email
        const findMatchingAdmins = () => {
          const matchedEmails = [];

          // Check if coop.admin (email) exists in availableAdmins
          if (coop.admin) {
            const adminByEmail = availableAdmins.find(
              (admin) => admin.email === coop.admin
            );
            if (adminByEmail) {
              matchedEmails.push(adminByEmail.email);
            }
          }

          // Check if coop.adminName exists in availableAdmins
          if (coop.adminName) {
            const adminByName = availableAdmins.find(
              (admin) => admin.name === coop.adminName
            );
            if (adminByName && !matchedEmails.includes(adminByName.email)) {
              matchedEmails.push(adminByName.email);
            }
          }

          return matchedEmails;
        };

        setFormData({
          name: coop.name || "",
          sector: coop.sector || "",
          country: coop.country || "",
          state: findMatchingState(coop.state),
          regNumber: coop.RegNumber || "",
          court: coop.CourtName || "",
          sharePrice: "",
          admins: findMatchingAdmins(),
          logo: null,
          bannerImage: null,
          about: coop.about || "",
        });
      } else {
        // Reset form if no coop data
        setFormData({
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
      }
      formPopulatedRef.current = true; // Mark form as populated
    }
  }, [isOpen, coop, states, availableAdmins]);

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
      // console.log("Admin selection changed:", { adminEmail, newAdmins });
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
      // const creationPromise = new Promise((resolve) =>
      //   setTimeout(resolve, 500)
      // );

      const selectedSector = sectors.find(
        (sector) => sector.key === formData.sector
      );

      const updatedFormData = {
        ...formData,
        sector: selectedSector.name, // Replace sector key with full sector name
      };

      // const creationPromise = createCooperative(updatedFormData);
      // const pendingPromise = approveCoopPlatformRegistry(coop.$id);

      // const creationPromises = Promise.all([
      //   createCooperative(updatedFormData),
      //   approveCoopPlatformRegistry(coop.$id),
      // ]

      const creationPromises = createCooperative(updatedFormData).then(() =>
        approveCoopPlatformRegistry(coop.$id)
      );

      toast.promise(creationPromises, {
        loading: "Creating your cooperative...",
        success: () => {
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
                  <option key={sector.key} value={sector.key}>
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
                  availableAdmins.map((admin, index) => {
                    const isSelected = formData.admins.includes(admin.email);
                    const isVerified = admin.isVerified !== false;
                    return (
                      <button
                        key={admin.id || admin.email || `admin-${index}`}
                        type="button"
                        onClick={() => handleAdminChange(admin.email)}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          isSelected
                            ? isVerified
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-red-600 text-white border-red-600"
                            : isVerified
                            ? "bg-white dark:bg-slate-700 dark:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-600"
                            : "bg-white dark:bg-slate-700 border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-600"
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

export const EditCoopModal = ({ isOpen, onClose, coop, triggerReload }) => {
  const [formData, setFormData] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // const [confirmId, setConfirmId] = useState("");
  const [error, setError] = useState("");
  const [availableAdmins, setAvailableAdmins] = useState([]);
  const idRef = useRef(null);

  // Load coop details when modal opens
  useEffect(() => {
    if (isOpen && coop) {
      const fetchDetails = async () => {
        setIsLoading(true);
        try {
          const coopDetails = await getCoopByRegNumber(coop.RegNumber);
          const admins = await getPotentialAdmins();
          if (coopDetails) {
            coopDetails.adminEmails = coopDetails.adminEmails || [];
            setFormData(coopDetails);
            setAvailableAdmins(admins);
          } else {
            setError(
              "Could not load cooperative details. Ensure the cooperative exists."
            );
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
      // setConfirmId("");
    }
  }, [isOpen, coop]);

  const handleChange = (e) => {
    console.log("No Change Possible Here");
  };

  const handleAdminChange = (emails) => {
    setFormData((prev) => ({ ...prev, adminEmails: emails }));
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    const { ...payload } = formData;
    try {
      // await new Promise((resolve) => setTimeout(resolve, 500));

      await updateCooperativeById(formData.id, {
        ...payload,
        logoFile,
        bannerFile,
      });
      await approveCoopPlatformRegistry(coop.$id);
      triggerReload(Date.now());
      onClose();
    } catch (err) {
      alert(`Failed to update: ${err.message}`);
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
                    {formData.id}
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
                  disabled
                  onChange={handleChange}
                />

                <InputField2
                  name="sector"
                  label="Sector"
                  value={formData.sector || ""}
                  disabled
                  onChange={handleChange}
                />
                <InputField2
                  name="pendingAdmin"
                  label="Addition Requested By"
                  value={`${coop.adminName} (${coop.admin})`}
                  disabled
                />

                <InputField2
                  name="regNumber"
                  label="Registration Number"
                  value={formData.regNumber || ""}
                  disabled
                  onChange={handleChange}
                />

                <MultiSelectAdmins
                  options={availableAdmins}
                  selectedEmails={formData.adminEmails || []}
                  onChange={handleAdminChange}
                />

                <InputField2
                  name="state"
                  label="State"
                  value={formData.state || ""}
                  disabled
                  onChange={handleChange}
                />

                <InputField2
                  name="country"
                  label="Country"
                  value={formData.country || ""}
                  disabled
                  onChange={handleChange}
                />
                <InputField2
                  name="CourtName"
                  label="Court of Registration"
                  value={formData.CourtName || ""}
                  disabled
                  onChange={handleChange}
                />

                <InputField2
                  name="sharePrice"
                  label="Share Price (€)"
                  value={formData.sharePrice}
                  onChange={handleChange}
                  disabled
                />
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
