"use client";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PlusCircle, User, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import {
  addAuditComment,
  getAuditCommentsByCoopId,
} from "../../lib/AuditCommentService";
import {
  setAuditStatusApproved,
  setAuditStatusAskedToResubmit,
  setAuditStatusRejected,
} from "../../lib/AuditService";
import {
  notifyAuditRejection,
  notifyAuditAccepted,
  notifyAuditResubmissionRequested,
} from "../../lib/customNotificationTemplates";
import { getCoopByIdForAudit as getCoopById } from "../../lib/getCoopsService";
import { getCoopAuditerIds } from "../../lib/addCoopService";
import { getUserByListOfIdsService } from "../../lib/allUsersService";
import { createNotification } from "@/lib/notificationService";

function ReviewModal({
  coopid,
  isOpen,
  onClose,
  setReload,
  onApprove,
  onReject,
  onAskToResubmit,
  existingComments = [],
  submissionHistory = [],
}) {
  const [activeTab, setActiveTab] = useState("submit");
  const [comments, setComments] = useState([]);
  const [historycomments, setHistoryComments] = useState(existingComments);
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();
  const [coopadmins, setCoopAdmins] = useState([]);
  const [coopdata, setCoopData] = useState({});

  useEffect(() => {
    async function loadComments() {
      const prevComments = await getAuditCommentsByCoopId(coopid);
      // console.log(prevComments);
      setHistoryComments(prevComments?.comments || []);
    }
    async function loadAdmins() {
      const currentcoopdata = await getCoopById(coopid);
      setCoopData(currentcoopdata);
      setCoopAdmins(
        Array.isArray(currentcoopdata?.adminEmails)
          ? currentcoopdata.adminEmails
          : []
      );
      // console.log(
      //   Array.isArray(currentcoopdata?.adminEmails)
      //     ? currentcoopdata.adminEmails
      //     : []
      // );
    }
    loadComments();
    loadAdmins();
  }, []);

  const handleAddComment = () => {
    if (newComment.trim() !== "") {
      setComments([newComment, ...comments]);
      setNewComment("");
    }
  };

  //   async function notifyAdmins(type) {
  //     coopadmins.map((adminEmail) => {
  //       if (type === "APPROVED") {
  //         notifyAuditAccepted(adminEmail, user.email, coopdata);
  //       } else if (type === "REJECTED") {
  //         notifyAuditRejection(adminEmail, user.email, coopdata);
  //       } else if (type === "ASKED_TO_RESUBMIT") {
  //         notifyAuditResubmissionRequested(adminEmail, user.email, coopdata);
  //       }
  //     });
  //   }

  async function notifyAdmins(type) {
    // 1. NORMAL ADMIN NOTIFICATIONS
    coopadmins.forEach((adminEmail) => {
      if (type === "APPROVED") {
        notifyAuditAccepted(adminEmail, user.email, coopdata);
      } else if (type === "REJECTED") {
        notifyAuditRejection(adminEmail, user.email, coopdata);
      } else if (type === "ASKED_TO_RESUBMIT") {
        notifyAuditResubmissionRequested(adminEmail, user.email, coopdata);
      }
    });

    // 2. NEW LOGIC: IF CURRENT USER IS AN Remaining AUDITOR
    if (user.role === "aud_E") {
      try {
        // Get all auditor ids assigned to this coop
        const auditorIds = await getCoopAuditerIds(coopdata.id);

        // Get full user objects
        const auditorUsers = await getUserByListOfIdsService(auditorIds);

        // Extract their emails, excluding the current user
        const otherAuditorEmails = auditorUsers
          .map((u) => u.email)
          .filter((email) => email && email !== user.email);

        // Send notification to all other auditors
        for (const email of otherAuditorEmails) {
          await createNotification({
            createdBy: user.email,
            createdFor: email,
            message: getNotificationMessage(
              type,
              coopdata,
              user.email,
              auditorUsers
            ), // helper below
          });
        }
      } catch (error) {
        console.error("Error notifying auditors:", error);
      }
    }
  }

  // Helper that builds the correct message based on type
  function getNotificationMessage(
    type,
    coopdata,
    currentAuditorEmail,
    coopAuditors
  ) {
    const auditorName =
      coopAuditors.find((a) => a.email === currentAuditorEmail)?.name ||
      "an auditor";
    if (type === "APPROVED") {
      return `✅ The audit for ${coopdata.name} is approved by ${currentAuditorEmail} (${auditorName}).`;
    } else if (type === "REJECTED") {
      return `❌ The audit for ${coopdata.name} is rejected by ${currentAuditorEmail} (${auditorName}).`;
    } else if (type === "ASKED_TO_RESUBMIT") {
      return `⚠️ The audit for ${coopdata.name} is currently sent back for resubmission by ${currentAuditorEmail} (${auditorName}).`;
    }
  }

  const handleSubmit = async (type) => {
    const payload = {
      coopid: coopid,
      submissionType: type,
      commentText: comments,
      timestamp: new Date().toISOString(),
      submittedBy: user.email, // Replace with actual user email
    };
    await addAuditComment(payload);

    await notifyAdmins(type);
    if (type === "APPROVED") {
      await setAuditStatusApproved(coopid, coopdata?.currentAuditId);
      setReload(Date.now());
    } else if (type === "REJECTED") {
      await setAuditStatusRejected(coopid, coopdata?.currentAuditId);
      setReload(Date.now());
    } else if (type === "ASKED_TO_RESUBMIT") {
      await setAuditStatusAskedToResubmit(coopid, coopdata?.currentAuditId);
      setReload(Date.now());
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans bg-black bg-opacity-60">
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        >
          {/* Modal Header */}
          <div className="sticky top-0 flex items-center justify-between p-5 bg-white border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Audit Review
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("submit")}
              className={`flex-1 py-2 text-center ${activeTab === "submit"
                ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                : "text-gray-600"
                }`}
            >
              Submit Comment
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-2 text-center ${activeTab === "history"
                ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                : "text-gray-600"
                }`}
            >
              History
            </button>
          </div>

          {/* Submit Tab */}
          {activeTab === "submit" && (
            <div className="flex-grow p-6 overflow-y-auto">
              <h3 className="mb-2 font-semibold text-gray-700">
                Add a new comment
              </h3>
              <div className="flex items-start gap-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full p-2 transition border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder="Type your comment here..."
                  rows="3"
                />
                <button
                  onClick={handleAddComment}
                  className="px-3 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  <PlusCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6">
                <h3 className="mb-3 font-semibold text-gray-700">
                  Comments Preview
                </h3>
                <div className="space-y-4">
                  {comments.length > 0 ? (
                    comments.map((comment, index) => (
                      <div
                        key={index}
                        className="p-3 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <p className="text-gray-800">{comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="py-4 text-center text-gray-500">
                      No comments yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === "history" && (
            <div className="flex-grow p-6 overflow-y-auto">
              <h3 className="mb-4 font-semibold text-gray-700">
                Submission History
              </h3>
              {historycomments.length > 0 ? (
                <div className="space-y-4">
                  {historycomments
                    .sort(
                      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
                    )
                    .map((entry, idx) => (
                      <div
                        key={idx}
                        className="p-4 border border-gray-300 rounded-md bg-gray-50"
                      >
                        <div className="mb-2">
                          <span className="text-sm font-semibold text-gray-600">
                            Status:{" "}
                          </span>
                          <span className="font-semibold text-blue-700">
                            {entry.submissionType}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-800">
                          {entry.text?.map((c, i) => (
                            <p
                              key={i}
                              className="pl-2 italic border-l-4 border-blue-200"
                            >
                              "{c}"
                            </p>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-right text-gray-500">
                          Submitted by <strong>{entry.submittedBy}</strong> on{" "}
                          {new Date(entry.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="py-4 text-center text-gray-500">
                  No submission history available.
                </p>
              )}
            </div>
          )}

          {/* Footer Buttons */}
          {activeTab === "submit" && (
            <div className="sticky bottom-0 flex flex-wrap justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => handleSubmit("ASKED_TO_RESUBMIT")}
                className="px-4 py-2 text-white bg-yellow-500 rounded-md hover:bg-yellow-600"
              >
                Request Resubmission
              </button>
              <button
                onClick={() => handleSubmit("REJECTED")}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Reject
              </button>
              <button
                onClick={() => handleSubmit("APPROVED")}
                className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default ReviewModal;
