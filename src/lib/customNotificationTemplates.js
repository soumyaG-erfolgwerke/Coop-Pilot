import {
  getAllAuditersService,
  getUserByListOfIdsService,
} from "./allUsersService.js";
import { createNotification } from "./notificationService.js";
import { getCoopAuditerIds } from "./addCoopService.js";

export const notifyAuditRejection = async (userId, adminId, coopdata) => {
  return await createNotification({
    createdBy: adminId,
    createdFor: userId,
    message: `Your submission for ${coopdata.name} was rejected after audit.`,
  });
};

export const notifyAuditAccepted = async (userId, adminId, coopdata) => {
  return await createNotification({
    createdBy: adminId,
    createdFor: userId,
    message: `Your submission  ${coopdata.name} has been accepted after audit.`,
  });
};

export const notifyAuditResubmissionRequested = async (
  userId,
  adminId,
  coopdata,
) => {
  console.log("Notification resubmission requested");
  return await createNotification({
    createdBy: adminId,
    createdFor: userId,
    message: `Your submission   ${coopdata.name} needs revision. Please resubmit.`,
  });
};

// export const notifyAuditUnderReview = async (adminId, coopdata) => {
//   const results = [];

//   for (const email of coopdata.adminEmails) {
//     const result = await createNotification({
//       createdBy: adminId,
//       createdFor: email, // Assuming email is valid recipient (user ID or email)
//       message: `The submission for ${coopdata.name} is currently under review.`,
//     });
//     results.push(result);
//   }

//   return results; // Returns array of all created notifications
// };

export const notifyAuditUnderReview = async (adminId, coopdata) => {
  // 1. Notify all admins first
  const adminNotifications = await Promise.all(
    coopdata.adminEmails.map((email) =>
      createNotification({
        createdBy: adminId,
        createdFor: email,
        message: `The submission for ${coopdata.name} is currently under review.`,
      }),
    ),
  );

  const assignedAuditors = await getCoopAuditerIds(coopdata.id);

  // 2. Fetch auditor details (if IDs exist)
  const coopAuditors =
    Array.isArray(assignedAuditors) && assignedAuditors.length > 0
      ? (await getUserByListOfIdsService(assignedAuditors)).filter(
          (a) => !!a.email,
        )
      : [];

  // 3. Remove the auditor who is currently reviewing
  const remainingAuditors = coopAuditors.filter(
    (auditor) => auditor.email !== adminId,
  );

  // 4. Notify remaining auditors
  const auditorNotifications = await Promise.all(
    remainingAuditors.map((auditor) =>
      createNotification({
        createdBy: adminId,
        createdFor: auditor.email,
        message: `The audit for ${
          coopdata.name
        } is currently under review by ${adminId} (${
          coopAuditors.find((a) => a.email === adminId)?.name || "an auditor"
        }).`,
      }),
    ),
  );

  // 5. Return all notifications together
  return [...adminNotifications, ...auditorNotifications];
};

export const notifyCoopSubmittedForAudit = async (userId, coopdata) => {
  const globalAuditors = await getAllAuditersService();
  const assignedAuditors = await getCoopAuditerIds(coopdata.id);

  const globalAuditorEmails = globalAuditors.map((a) => a?.email);

  // If coopdata.auditers has IDs → fetch users → extract emails
  const coopAuditorEmails =
    Array.isArray(assignedAuditors) && assignedAuditors.length > 0
      ? (await getUserByListOfIdsService(assignedAuditors))
          .map((user) => user?.email)
          .filter(Boolean)
      : [];

  const allRecipients = [
    ...new Set([...globalAuditorEmails, ...coopAuditorEmails]),
  ];

  const notifications = allRecipients.map((email) =>
    createNotification({
      createdBy: userId,
      createdFor: email,
      message: `${coopdata.name} has been submitted for audit review. Please review.`,
    }),
  );

  return await Promise.all(notifications);
};

export const notifyNewAuditorAuditAssigned = async (
  coopName,
  selected,
  current,
) => {
  // Remove auditers who were already assigned
  const newAssignedAuditors = selected.filter(
    (auditorId) => !current.includes(auditorId),
  );

  const newAuditorsEmail =
    Array.isArray(newAssignedAuditors) && newAssignedAuditors.length > 0
      ? (await getUserByListOfIdsService(newAssignedAuditors))
          .map((user) => user?.email)
          .filter(Boolean)
      : [];

  //mail all new assigned auditors
  const notifications = newAuditorsEmail.map((auditorEmail) =>
    createNotification({
      createdBy: "system",
      createdFor: auditorEmail,
      message: `You have been assigned as an auditor for ${coopName}. Please review.`,
    }),
  );

  return await Promise.all(notifications);
};
