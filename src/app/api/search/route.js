import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite-server";
import { Query } from "node-appwrite";
import { resolveSession } from "@/lib/auth/session";

// Main GET endpoint for Multi-Cooperative Global Search
export async function GET(request) {
  try {
    // 1. Resolve active user session using standard session helper
    let session = null;
    try {
      session = await resolveSession();
    } catch (e) {
      console.log("Global search session error:", e.message);
    }

    if (!session || (!session.userId && !session.profile)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryStr = (searchParams.get("q") || "").trim();

    // 2. Enforce minimum query length to prevent unnecessary backend load
    if (!queryStr || queryStr.length < 2) {
      return NextResponse.json({
        success: true,
        results: {
          members: [],
          documents: [],
          transactions: [],
          resolutions: [],
          applications: [],
        },
      });
    }

    // 3. Use admin client for database access across collections
    const { databases } = createAdminClient();
    const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "683f1cd50000a6e0019a";

    // Standard Collection IDs from Appwrite schema
    const COLLECTION_PROFILE = "683f1d64000112836b66";
    const COLLECTION_DOCUMENTS = "69e754740021de20a45d";
    const COLLECTION_COOP_DOCS = "6a15b7f200107facc85e";
    const COLLECTION_TRANSACTIONS = "683f2692002574988b87";
    const COLLECTION_ASSEMBLIES = "assemblies";
    const COLLECTION_APPLICATIONS = "69d40812002f183fd39b";

    const userId = session.userId || session.profile?.userId;
    const userRole = session.role || session.profile?.role || "";

    // 4. Resolve Multi-Cooperative Authorized Scope (GitHub Organization Model)
    // Collects all cooperative IDs associated with the logged-in Coop Admin / User
    let allowedCoopIds = [];
    if (session.coopId) allowedCoopIds.push(session.coopId);
    if (session.profile?.coopId) allowedCoopIds.push(session.profile.coopId);
    if (session.profile?.cooperativeId) allowedCoopIds.push(session.profile.cooperativeId);

    // Fetch all user profiles matching userId to build full multi-coop scope
    try {
      const userProfilesRes = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_PROFILE,
        [
          Query.equal("userId", userId),
          Query.limit(50),
        ]
      );
      if (userProfilesRes.documents.length > 0) {
        userProfilesRes.documents.forEach((p) => {
          if (p.coopId && !allowedCoopIds.includes(p.coopId)) {
            allowedCoopIds.push(p.coopId);
          }
          if (p.cooperativeId && !allowedCoopIds.includes(p.cooperativeId)) {
            allowedCoopIds.push(p.cooperativeId);
          }
          if (Array.isArray(p.coopIds)) {
            p.coopIds.forEach((id) => {
              if (id && !allowedCoopIds.includes(id)) allowedCoopIds.push(id);
            });
          }
        });
      }
    } catch (e) {
      console.log("Multi-coop profile lookup note:", e.message);
    }

    // Deduplicate allowedCoopIds
    allowedCoopIds = [...new Set(allowedCoopIds.filter(Boolean))];

    const termLower = queryStr.toLowerCase();

    // 5. Execute parallel Appwrite queries for Members, Documents, Transactions, Resolutions & Applications
    const [
      membersRes,
      docsRes,
      coopDocsRes,
      txRes,
      assembliesRes,
      appsRes
    ] = await Promise.allSettled([
      // A. Query Members by name or email
      databases.listDocuments(DATABASE_ID, COLLECTION_PROFILE, [
        Query.limit(100),
      ]),

      // B. Query Document Repository (COLLECTION_ID_DOCUMENTS 69e754740021de20a45d)
      databases.listDocuments(DATABASE_ID, COLLECTION_DOCUMENTS, [
        Query.limit(100),
      ]),

      // C. Query Cooperative Evidence Documents (6a15b7f200107facc85e)
      databases.listDocuments(DATABASE_ID, COLLECTION_COOP_DOCS, [
        Query.limit(100),
      ]),

      // D. Query Financial Transactions
      databases.listDocuments(DATABASE_ID, COLLECTION_TRANSACTIONS, [
        Query.limit(100),
      ]),

      // E. Query Assembly Resolutions
      databases.listDocuments(DATABASE_ID, COLLECTION_ASSEMBLIES, [
        Query.limit(100),
      ]),

      // F. Query Onboarding & KYC Applications
      databases.listDocuments(DATABASE_ID, COLLECTION_APPLICATIONS, [
        Query.limit(100),
      ])
    ]);

    // Helper: Verify if record belongs to authorized multi-coop scope for Coop Admin
    const isCoopAllowed = (recordCoopId) => {
      // Super admins / auditors can search across all cooperatives
      if (["org_admin", "auditer", "aud_E", "aud_T"].includes(userRole)) return true;
      if (allowedCoopIds.length === 0) return true; // If no coop restrictions on user, allow search
      if (!recordCoopId) return true; // Shared global templates allowed
      return allowedCoopIds.includes(recordCoopId);
    };

    // 6. Process and filter Members across authorized cooperatives
    // Inspects FirstName, LastName, fullName, name, contactEmail, and email with domain safety
    const rawMembers = membersRes.status === "fulfilled" ? membersRes.value.documents : [];
    const members = rawMembers
      .filter((m) => {
        if (!isCoopAllowed(m.coopId || m.cooperativeId)) return false;
        
        // Extract complete name from all possible Appwrite schema fields
        const constructedName = `${m.FirstName || m.firstName || ""} ${m.LastName || m.lastName || ""}`.trim();
        const fullName = (constructedName || m.fullName || m.name || "").toLowerCase();
        const rawEmail = (m.contactEmail || m.email || "").toLowerCase();
        const emailPrefix = rawEmail.split("@")[0] || "";
        const num = String(m.memberId || m.memberNumber || m.$id || "").toLowerCase();

        // Match against full name, first name, last name, member ID, or email prefix/full email
        const matchesName = fullName.includes(termLower);
        const matchesEmail = rawEmail.includes(termLower) && (termLower.includes("@") || emailPrefix.includes(termLower));
        const matchesNum = num.includes(termLower);

        return matchesName || matchesEmail || matchesNum;
      })
      .slice(0, 8)
      .map((m) => {
        const constructedName = `${m.FirstName || m.firstName || ""} ${m.LastName || m.lastName || ""}`.trim();
        const displayName = constructedName || m.fullName || m.name || m.email || "Member";
        const displayEmail = m.contactEmail || m.email || "";
        const targetCoop = m.coopId || m.cooperativeId || (allowedCoopIds.length > 0 ? allowedCoopIds[0] : "");
        const targetUserId = m.userId || m.$id;
        return {
          id: m.$id,
          title: displayName,
          subtitle: displayEmail ? `${displayEmail} ${m.memberId ? `• Member #${m.memberId}` : ""}` : "Cooperative Member",
          type: "member",
          url: `/memberDetails/${targetUserId}${targetCoop ? `?coopId=${targetCoop}` : ""}`,
          badge: "Member",
        };
      });

    // 7. Process and filter Documents across authorized cooperatives
    // Matches Document Title ("Weekly Hours Worked Summary"), File Name, Category, Tags, Ref ID & Uploaders
    const rawDocs = [
      ...(docsRes.status === "fulfilled" ? docsRes.value.documents : []),
      ...(coopDocsRes.status === "fulfilled" ? coopDocsRes.value.documents : [])
    ];
    const documents = rawDocs
      .filter((d) => {
        if (!isCoopAllowed(d.coopId || d.cooperativeId)) return false;
        const title = (d.title || d.fileName || d.name || d.filename || "").toLowerCase();
        const cat = (d.category || d.folder || d.type || "").toLowerCase();
        const ref = (d.refId || d.refYear || d.$id || "").toLowerCase();
        const tags = Array.isArray(d.tags) ? d.tags.join(" ").toLowerCase() : (d.tags || "").toLowerCase();
        const uploader = (d.uploaderName || d.uploadedBy || "").toLowerCase();
        return (
          title.includes(termLower) ||
          cat.includes(termLower) ||
          ref.includes(termLower) ||
          tags.includes(termLower) ||
          uploader.includes(termLower)
        );
      })
      .slice(0, 8)
      .map((d) => ({
        id: d.$id,
        title: d.title || d.fileName || d.name || "Untitled Document",
        subtitle: `${d.category || "FINANZEN"} • ${d.fileType || d.ext || "PDF"} ${d.uploadedAt || d.$createdAt ? `• ${new Date(d.uploadedAt || d.$createdAt).toLocaleDateString()}` : ""}`,
        type: "document",
        url: `/dashboard?tab=doc-upload&docId=${d.$id}`,
        badge: d.category || "Document",
        fileType: d.fileType || d.ext || "pdf",
      }));

    // 8. Process and filter Transactions across authorized cooperatives
    const rawTx = txRes.status === "fulfilled" ? txRes.value.documents : [];
    const transactions = rawTx
      .filter((t) => {
        if (!isCoopAllowed(t.coopId || t.cooperativeId)) return false;
        const ref = (t.reference || t.refNo || t.$id || "").toLowerCase();
        const amt = String(t.amount || "").toLowerCase();
        const name = (t.memberName || t.sender || "").toLowerCase();
        return ref.includes(termLower) || amt.includes(termLower) || name.includes(termLower);
      })
      .slice(0, 5)
      .map((t) => ({
        id: t.$id,
        title: `Transaction ${t.reference || t.$id.substring(0, 8)}`,
        subtitle: `${t.amount ? `€${t.amount}` : ""} ${t.memberName ? `• ${t.memberName}` : ""} ${t.status ? `• ${t.status}` : ""}`,
        type: "transaction",
        url: `/dashboard?tab=transactions`,
        badge: t.status || "Transaction",
      }));

    // 9. Process and filter Assembly Resolutions across authorized cooperatives
    const rawAssemblies = assembliesRes.status === "fulfilled" ? assembliesRes.value.documents : [];
    const resolutions = rawAssemblies
      .filter((a) => {
        if (!isCoopAllowed(a.coopId || a.cooperativeId)) return false;
        const title = (a.title || a.name || a.topic || "").toLowerCase();
        const year = String(a.year || a.assemblyYear || "").toLowerCase();
        const desc = (a.description || a.summary || "").toLowerCase();
        return title.includes(termLower) || year.includes(termLower) || desc.includes(termLower);
      })
      .slice(0, 5)
      .map((a) => ({
        id: a.$id,
        title: a.title || a.topic || `Assembly ${a.year || ""}`,
        subtitle: `${a.year ? `Assembly Year ${a.year}` : "General Assembly"} ${a.status ? `• ${a.status}` : ""}`,
        type: "resolution",
        url: `/dashboard?tab=assembly`,
        badge: "Resolution",
      }));

    // 10. Process and filter Applications across authorized cooperatives
    const rawApps = appsRes.status === "fulfilled" ? appsRes.value.documents : [];
    const applications = rawApps
      .filter((ap) => {
        if (!isCoopAllowed(ap.coopId || ap.cooperativeId)) return false;
        const name = (ap.applicantName || ap.fullName || ap.name || "").toLowerCase();
        const email = (ap.email || "").toLowerCase();
        const status = (ap.status || "").toLowerCase();
        return name.includes(termLower) || email.includes(termLower) || status.includes(termLower);
      })
      .slice(0, 5)
      .map((ap) => ({
        id: ap.$id,
        title: ap.applicantName || ap.fullName || ap.email || "Membership Application",
        subtitle: `${ap.email || ""} ${ap.status ? `• Status: ${ap.status}` : ""}`,
        type: "application",
        url: `/dashboard?tab=onboarding-member`,
        badge: ap.status || "Application",
      }));

    // 11. Return clean multi-cooperative search results
    return NextResponse.json({
      success: true,
      query: queryStr,
      results: {
        members,
        documents,
        transactions,
        resolutions,
        applications,
      },
    });
  } catch (error) {
    console.error("Global multi-coop search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to perform search query" },
      { status: 500 }
    );
  }
}
