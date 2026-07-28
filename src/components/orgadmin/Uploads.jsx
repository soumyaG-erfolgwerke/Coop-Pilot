import { useEffect, useState } from "react";
import {
  Eye,
  Trash2,
  Pencil,
  FileImage,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { fetchAuditOrgFiles, updateAuditOrgFiles } from "@/lib/orgFileService";
import { FileUploadCard } from "../orgadminSignup/page3";
import { toast } from "react-hot-toast";

const FILE_TYPES = [
  { key: "logo_url", title: "Organization Logo" },
  { key: "stamp_url", title: "Organization Stamp" },
  { key: "letterhead_url", title: "Letterhead" },
  { key: "esign_url", title: "E-Signature" },
];

/* ---------------- Preview ---------------- */
const PreviewImage = ({ url, title }) => {
  const [error, setError] = useState(false);

  if (!url) {
    return (
      <div className="flex items-center justify-center w-full h-full text-xs text-gray-400">
        No File
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <AlertCircle size={18} className="text-amber-500" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={title}
      onError={() => setError(true)}
      className="object-cover w-full h-full"
    />
  );
};

/* ---------------- Confirm Modal ---------------- */
const ConfirmModal = ({ open, title, message, onCancel, onConfirm }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md p-5 bg-white rounded-xl shadow-lg dark:bg-slate-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {message}
        </p>

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------------- Main Component ---------------- */
const Uploads = () => {
  const [files, setFiles] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});
  const [editingField, setEditingField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    field: null,
  });

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const result = await fetchAuditOrgFiles();
      setFiles(result || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files?.[0];
    if (!file) return;

    setSelectedFiles((prev) => ({
      ...prev,
      [name]: file,
    }));
  };

  const handleRemove = (name) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [name]: null,
    }));
  };

  /* ---------------- OPEN MODAL INSTEAD OF window.confirm ---------------- */
  const handleDeleteClick = (field) => {
    setConfirmModal({
      open: true,
      field,
    });
  };

  const handleConfirmDelete = async () => {
    const field = confirmModal.field;

    try {
      await updateAuditOrgFiles({ field, action: "delete" });
      await loadFiles();
      toast.success("Deleted successfully");
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setConfirmModal({ open: false, field: null });
    }
  };

  const handleUpload = async (field) => {
    const file = selectedFiles[field];
    if (!file) return;

    setIsUploading(true);
    try {
      await updateAuditOrgFiles({ field, file });
      await loadFiles();

      setSelectedFiles((prev) => ({
        ...prev,
        [field]: null,
      }));

      setEditingField(null);
      toast.success("File uploaded successfully");
    } catch (err) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        Loading files...
      </div>
    );
  }

  return (
    <div className="m-4 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Organization Assets
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage logos, stamps and document branding assets.
        </p>
      </div>

      <ConfirmModal
        open={confirmModal.open}
        title="Delete File"
        message="Are you sure you want to delete this file? This action cannot be undone."
        onCancel={() => setConfirmModal({ open: false, field: null })}
        onConfirm={handleConfirmDelete}
      />

      <div className="overflow-hidden bg-white border border-gray-200 divide-y rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:divide-slate-700">
        {FILE_TYPES.map((item) => {
          const url = files[item.key];
          const isUploaded = !!url;
          const isEditing = editingField === item.key;

          return (
            <div
              key={item.key}
              className="p-4 transition-colors hover:bg-gray-50 dark:hover:bg-slate-750"
            >
              {!isEditing ? (
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center overflow-hidden border w-16 h-16 rounded-lg bg-gray-50 dark:bg-slate-900 dark:border-slate-700">
                      <PreviewImage url={url} title={item.title} />
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {item.title}
                      </h3>

                      <div className="mt-2">
                        {isUploaded ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                            <CheckCircle2 size={14} />
                            Uploaded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                            <AlertCircle size={14} />
                            Missing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700"
                      >
                        <Eye size={15} />
                        View
                      </a>
                    )}

                    <button
                      onClick={() => setEditingField(item.key)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700"
                    >
                      <Pencil size={15} />
                      {url ? "Replace" : "Upload"}
                    </button>

                    {url && (
                      <button
                        onClick={() => handleDeleteClick(item.key)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-600 border border-red-200 rounded-xl hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center overflow-hidden border w-16 h-16 rounded-lg bg-gray-50 dark:bg-slate-900 dark:border-slate-700">
                      <PreviewImage url={url} title={item.title} />
                    </div>
                    <h3 className="font-medium">{item.title}</h3>
                  </div>

                  <FileUploadCard
                    id={item.key}
                    name={item.key}
                    label={`Upload ${item.title}`}
                    icon={<FileImage size={24} />}
                    file={selectedFiles[item.key]}
                    onFileChange={handleFileChange}
                    onRemove={handleRemove}
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleUpload(item.key)}
                      disabled={!selectedFiles[item.key] || isUploading}
                      className="px-4 py-2 text-sm font-medium text-white rounded-xl bg-primary disabled:opacity-50"
                    >
                      Save
                    </button>

                    <button
                      onClick={() => {
                        setEditingField(null);
                        setSelectedFiles((prev) => ({
                          ...prev,
                          [item.key]: null,
                        }));
                      }}
                      className="px-4 py-2 text-sm border rounded-xl"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Uploads;