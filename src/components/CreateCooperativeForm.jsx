"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { createInactiveCooperative } from "../lib/addCoopService";
import { getAllSectorService } from "../lib/sectorsService";
import { getAllStatesService } from "../lib/statesService";

// Reusable Input Field Component
const InputField = ({ id, label, type = "text", value, onChange, error, required }) => (
  <div className="space-y-1">
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      id={id}
      name={id}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-3 text-sm shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/80 dark:text-gray-200 transition"
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

export default function CreateCooperativeForm() {
  const [formData, setFormData] = useState({
    name: "",
    country: "",
    state: "",
    sector: "",
    sharePrice: "",
    court: "",
    regNumber: "",
    about: "",
    logo: null,
    banner: null,
  });

  const [preview, setPreview] = useState({ logo: null, banner: null });
  const [success, setSuccess] = useState("");
  const [errors, setErrors] = useState({});
  const [sectors, setSectors] = useState([]);
  const [states, setStates] = useState([]);

  // Fetch dropdown data
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

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
      setPreview({ ...preview, [name]: URL.createObjectURL(files[0]) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const coopData = {
      ...formData,
      sharePrice: parseFloat(formData.sharePrice),
      status: "inactive",
      bannerUrl: formData.banner,
    };

    try {
      await createInactiveCooperative(coopData);
      setSuccess("🎉 Cooperative created successfully!");
      setFormData({
        name: "",
        country: "",
        state: "",
        sector: "",
        sharePrice: "",
        court: "",
        regNumber: "",
        about: "",
        logo: null,
        banner: null,
      });
      setPreview({ logo: null, banner: null });

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error creating cooperative:", error);
      setSuccess("❌ Something went wrong. Please try again.");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-tint dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 px-6 py-12 overflow-hidden">
      {/* Background Accent Elements */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-primary/80/20 dark:bg-primary/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-80 h-80 bg-purple-400/20 dark:bg-purple-500/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-5xl z-10"
      >
        {/* Success / Error Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`mb-6 p-4 rounded-xl text-center font-semibold shadow-lg backdrop-blur-md
              ${success.startsWith("🎉") ? "bg-green-100/80 text-green-700" : "bg-red-100/80 text-red-700"}`}
          >
            {success}
          </motion.div>
        )}

        <motion.form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/90 dark:bg-slate-900/90 shadow-2xl backdrop-blur-md rounded-3xl p-10 border border-gray-100 dark:border-slate-700"
          whileHover={{ scale: 1.002 }}
        >
          <InputField id="name" label="Cooperative Name" value={formData.name} onChange={handleChange} error={errors.name} required />

          {/* Sector Dropdown */}
          <div className="space-y-1">
            <label htmlFor="sector" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Sector <span className="text-red-500">*</span>
            </label>
            <select
              id="sector"
              name="sector"
              value={formData.sector}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-3 text-sm shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/80 dark:text-gray-200 transition"
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
            {errors.sector && <p className="text-xs text-red-500">{errors.sector}</p>}
          </div>

          <InputField id="country" label="Country" value={formData.country} onChange={handleChange} error={errors.country} required />

          {/* State Dropdown */}
          <div className="space-y-1">
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              State/Province <span className="text-red-500">*</span>
            </label>
            <select
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-3 text-sm shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/80 dark:text-gray-200 transition"
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
            {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
          </div>

          <InputField id="sharePrice" label="Share Price" type="number" value={formData.sharePrice} onChange={handleChange} error={errors.sharePrice} required />
          <InputField id="court" label="Court Name" value={formData.court} onChange={handleChange} error={errors.court} required />
          <InputField id="regNumber" label="Registration Number" value={formData.regNumber} onChange={handleChange} error={errors.regNumber} required />

          {/* About Section */}
          <div className="md:col-span-2 space-y-1">
            <label htmlFor="about" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              About <span className="text-red-500">*</span>
            </label>
            <textarea
              id="about"
              name="about"
              rows="4"
              value={formData.about}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-3 text-sm shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/80 dark:text-gray-200 transition"
            />
            {errors.about && <p className="text-xs text-red-500">{errors.about}</p>}
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <label htmlFor="logo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Logo
            </label>
            <input
              type="file"
              id="logo"
              name="logo"
              accept="image/*"
              onChange={handleChange}
              className="block w-full text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:rounded-xl file:border-0 file:bg-tint dark:file:bg-slate-700 file:px-4 file:py-2.5 file:font-semibold file:text-blue-700 hover:file:bg-blue-200 transition"
            />
            {preview.logo && (
              <img src={preview.logo} alt="Logo Preview" className="mt-2 h-20 w-20 object-cover rounded-full border shadow-md" />
            )}
          </div>

          {/* Banner Upload */}
          <div className="space-y-2">
            <label htmlFor="banner" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Banner
            </label>
            <input
              type="file"
              id="banner"
              name="banner"
              accept="image/*"
              onChange={handleChange}
              className="block w-full text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:rounded-xl file:border-0 file:bg-purple-100 dark:file:bg-slate-700 file:px-4 file:py-2.5 file:font-semibold file:text-purple-700 hover:file:bg-purple-200 transition"
            />
            {preview.banner && (
              <img src={preview.banner} alt="Banner Preview" className="mt-2 h-32 w-full object-cover rounded-lg border shadow-md" />
            )}
          </div>

          {/* Submit */}
          <div className="md:col-span-2 flex justify-end">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="rounded-xl bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-primary/80 transition"
            >
              Create Cooperative
            </motion.button>
          </div>
        </motion.form>
      </motion.div>
    </div>
  );
}
