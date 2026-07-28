"use client";

import React, { useRef, useState } from "react";
import {
  Image,
  Stamp,
  UploadCloud,
  X,
  FileImage,
} from "lucide-react";

export const FileUploadCard = ({
  id,
  name,
  label,
  icon,
  file,
  error,
  description,
  onFileChange,
  onRemove,
}) => {
  const inputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const previewUrl = file ? URL.createObjectURL(file) : null;

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];

    if (!droppedFile) return;

    const syntheticEvent = {
      target: {
        name,
        files: [droppedFile],
      },
    };

    onFileChange(syntheticEvent);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    }

    if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  return (
    <div className="animate-fadeInUp">
      <label
        htmlFor={id}
        className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-200 ${dragActive
            ? "border-primary bg-primary/5 scale-[1.01]"
            : error
              ? "border-red-400 bg-red-50 dark:bg-red-900/10"
              : "border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-primary/50"
          }`}
      >
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="file"
          accept="image/png"
          onChange={onFileChange}
          className="hidden"
        />

        {!file ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full px-6 py-10 text-center group"
          >
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10">
              {icon}
            </div>

            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
              <UploadCloud
                size={18}
                className="text-primary transition-transform duration-200 group-hover:-translate-y-0.5"
              />

              <span>Choose a file or drag & drop</span>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              PNG only • Max 2MB
            </p>
          </button>
        ) : (
          <div className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex items-center justify-center flex-shrink-0 w-24 h-24 overflow-hidden bg-gray-100 border rounded-xl dark:bg-slate-700 dark:border-slate-600">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="object-contain w-full h-full"
                    />
                  ) : (
                    <FileImage
                      size={28}
                      className="text-gray-400"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate dark:text-white">
                    {file.name}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                  <div className="inline-flex items-center gap-1 px-2 py-1 mt-3 text-xs font-medium text-green-700 bg-green-100 rounded-full dark:bg-green-900/20 dark:text-green-400">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    Ready to upload
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onRemove(name)}
                className="flex items-center justify-center flex-shrink-0 w-10 h-10 transition-colors rounded-full hover:bg-red-100 dark:hover:bg-red-900/20"
              >
                <X
                  size={18}
                  className="text-red-500"
                />
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {description}
      </p>

      {error && (
        <p className="mt-2 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

const Page3 = ({
  formData,
  handleFileChange,
  handleRemoveFile,
  errors,
  onSkip,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-tint dark:bg-primary-dark-900/30">
          <Image
            size={32}
            className="text-blue-600 dark:text-primary/80"
          />
        </div>

        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          Your Organisation&apos;s Branding &amp; Signature
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Branding und Unterschrift Ihrer Organisation
        </p>

        <p className="mt-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
          These assets are used on every Prufungsbericht and official
          communication generated through CoopPilot. You can skip this
          step now and complete it later — but you will not be able to
          generate or sign audit reports until at least your logo and
          QES certificate are uploaded.
        </p>
      </div>

      <div className="space-y-6">
        <FileUploadCard
          id="logoFile"
          name="logoFile"
          label="Organisation Logo (optional)"
          file={formData.logoFile}
          error={errors.logoFile}
          onFileChange={handleFileChange}
          onRemove={handleRemoveFile}
          icon={
            <Image
              size={26}
              className="text-primary"
            />
          }
          description="Upload your organisation's logo. Transparent PNG recommended."
        />

        <FileUploadCard
          id="stampFile"
          name="stampFile"
          label="Official Stamp (optional)"
          file={formData.stampFile}
          error={errors.stampFile}
          onFileChange={handleFileChange}
          onRemove={handleRemoveFile}
          icon={
            <Stamp
              size={26}
              className="text-primary"
            />
          }
          description="Upload your official stamp. Transparent background strongly recommended."
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onSkip}
          className="text-sm underline transition-colors text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
        >
          Skip for now — I&apos;ll complete this later
        </button>

        <span className="text-xs text-gray-400">
          Uberspringen — spater vervollstandigen
        </span>
      </div>
    </div>
  );
};

export default Page3;