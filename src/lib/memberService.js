import { Query } from "node-appwrite";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_TRANSACTION,
  COLLECTION_ID_PROFILE,
  COLLECTION_ID_KYC_APPLICATIONS,
  COLLECTION_ID_COOPXMEMBER,
} from "@/lib/appwrite-server";

export const getMembersOfCoopInternal = async (coopId) => {
  const { databases } = createAdminClient();

  const transactions = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION_ID_TRANSACTION,
    [
      Query.equal("coopId", coopId),
      Query.equal("verificationStatus", "verified"),
      Query.limit(100),
    ],
  );

  const grouped = {};

  for (const tx of transactions.documents) {
    const id = tx.memberId;

    if (!grouped[id]) {
      grouped[id] = { totalShares: 0, totalPrice: 0 };
    }

    grouped[id].totalShares += tx.shares;
    grouped[id].totalPrice += tx.price;
  }

  const memberIds = Object.keys(grouped);

  let profileMap = {};
  let kycMap = {};

  if (memberIds.length > 0) {
    const profiles = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("userId", memberIds)],
    );

    profiles.documents.forEach((p) => {
      profileMap[p.userId] = {
        name: `${p.FirstName || ""} ${p.LastName || ""}`.trim(),
        email: p.contactEmail || p.email || "",
      };
    });

    const kyc = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_KYC_APPLICATIONS,
      [
        Query.equal("userId", memberIds),
        Query.orderDesc("$createdAt"),
        Query.limit(5000)
      ],
    );

    const kycDocsByUser = {};
    kyc.documents.forEach(doc => {
      if (!kycDocsByUser[doc.userId]) {
        kycDocsByUser[doc.userId] = [];
      }
      kycDocsByUser[doc.userId].push(doc);
    });

    memberIds.forEach(userId => {
      const userDocs = kycDocsByUser[userId] || [];
      if (userDocs.length > 0) {
        const sortedDocs = [...userDocs].sort((a, b) => {
          const dateA = new Date(a.$createdAt || a.createdAt || 0);
          const dateB = new Date(b.$createdAt || b.createdAt || 0);
          return dateB - dateA;
        });
        const matchedDoc = sortedDocs.find(d => 
          (d.coopId === coopId || (d.coopId && d.coopId.$id === coopId)) ||
          (!d.coopId || (d.coopId && typeof d.coopId === 'object' && !d.coopId.$id))
        );
        if (matchedDoc) {
          kycMap[userId] = matchedDoc.kycStatus;
        }
      }
    });
  }

  return memberIds.map((id) => ({
    userId: id,
    membername: profileMap[id]?.name || "Unknown",
    memberemail: profileMap[id]?.email || "",
    kycStatus: kycMap[id] || "PENDING",
  }));
};

export const getNewVerifiedMemberCountInternal = async (coopId) => {
  const { databases } = createAdminClient();
  const response = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION_ID_COOPXMEMBER,
    [
      Query.equal("coopId", coopId),
      Query.equal("status", ["Active", "NoticeGiven", "Former"]),
      Query.limit(100000),
    ],
  );

  const targetStatuses = ["Active", "NoticeGiven", "Former"];
  // const uniqueUserIds = new Set();
  // for (const doc of response.documents) {
  //   const status = (doc.status || "");
  //   if (targetStatuses.includes(status)) {
  //     uniqueUserIds.add(doc.userId);
  //   }
  // }

  const UserIds = [];

  for (const doc of response.documents) {
    const status = doc.status || "";
    if (targetStatuses.includes(status)) {
      UserIds.push(doc.userId);
    }
  }

  return UserIds.length;
};

export const getAssemblyMemberCountInternal = async (coopId) => {
  const { databases } = createAdminClient();
  const response = await databases.listDocuments(
    DATABASE_ID,
    COLLECTION_ID_COOPXMEMBER,
    [
      Query.equal("coopId", coopId),
      Query.equal("status", ["Active", "NoticeGiven"]),
      Query.limit(100000),
    ],
  );

  const targetStatuses = ["Active", "NoticeGiven"];
  // const uniqueUserIds = new Set();
  // for (const doc of response.documents) {
  //   const status = (doc.status || "");
  //   if (targetStatuses.includes(status)) {
  //     uniqueUserIds.add(doc.userId);
  //   }
  // }

  const UserIds = [];

  for (const doc of response.documents) {
    const status = doc.status || "";
    if (targetStatuses.includes(status)) {
      UserIds.push(doc.userId);
    }
  }

  return UserIds.length;
};
