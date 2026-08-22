import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/appwrite-server";
import { Query } from "node-appwrite";
import { resolveSession } from "@/lib/auth/session";

// Main GET endpoint for Global Search
export async function GET(request) {
  try {
    // 1. Resolve active user session from request headers/cookies
    const session = await resolveSession(request);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryStr = (searchParams.get("q") || "").trim();

    // 2. Enforce minimum query length to prevent excessive backend load
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

    // 3. Extract active coopId for strict multi-tenancy scoping
    const coopId = session.user.coopId || session.user.cooperativeId || "";
    const userRole = session.user.role || "";

    // 4. Use admin client for database access across collections
    const { databases } = createAdminClient();
    const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "683f1cd50000a6e0019a";

    // Standard Collection IDs from Appwrite schema
    const COLLECTION_PROFILE = "683f1d64000112836b66";
    const COLLECTION_DOCUMENTS = "69e754740021de20a45d";
    const COLLECTION_COOP_DOCS = "6a15b7f200107facc85e";
    const COLLECTION_TRANSACTIONS = "683f2692002574988b87";
    const COLLECTION_ASSEMBLIES = "assemblies";
    const COLLECTION_APPLICATIONS = "69d40812002f183fd39b";

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
        Query.limit(50),
      ]),

      // B. Query General Documents by title/category
      databases.listDocuments(DATABASE_ID, COLLECTION_DOCUMENTS, [
        Query.limit(50),
      ]),

      // C. Query Cooperative Specific Evidence Documents
      databases.listDocuments(DATABASE_ID, COLLECTION_COOP_DOCS, [
        Query.limit(50),
      ]),

      // D. Query Financial Transactions by reference/amount
      databases.listDocuments(DATABASE_ID, COLLECTION_TRANSACTIONS, [
        Query.limit(50),
      ]),

      // E. Query Assembly Resolutions by title or year
      databases.listDocuments(DATABASE_ID, COLLECTION_ASSEMBLIES, [
        Query.limit(50),
      ]),

      // F. Query Onboarding & KYC Applications
      databases.listDocuments(DATABASE_ID, COLLECTION_APPLICATIONS, [
        Query.limit(50),
      ])
    ]);

    // 6. Process and filter Members (Strict Multi-Tenancy Scoping)
    const rawMembers = membersRes.status === "fulfilled" ? membersRes.value.documents : [];
    const members = rawMembers
      .filter((m) => {
        // Enforce coopId matching if present
        if (coopId && m.coopId && m.coopId !== coopId) return false;
        const name = (m.fullName || m.name || "").toLowerCase();
        const email = (m.email || "").toLowerCase();
        const num = String(m.memberId || m.memberNumber || "").toLowerCase();
        return name.includes(termLower) || email.includes(termLower) || num.includes(termLower);
      })
      .slice(0, 5)
      .map((m) => ({
        id: m.$id,
        title: m.fullName || m.name || m.email,
        subtitle: m.email ? `${m.email} ${m.memberId ? `• Member #${m.memberId}` : ""}` : "Cooperative Member",
        type: "member",
        url: `/admin/members?id=${m.$id}`,
        badge: "Member",
      }));

    // 7. Process and filter Documents (Title, Category, File Type, Tags, Uploaders)
    const rawDocs = [
      ...(docsRes.status === "fulfilled" ? docsRes.value.documents : []),
      ...(coopDocsRes.status === "fulfilled" ? coopDocsRes.value.documents : [])
    ];
    const documents = rawDocs
      .filter((d) => {
        if (coopId && d.coopId && d.coopId !== coopId) return false;
        const title = (d.title || d.name || d.filename || "").toLowerCase();
        const cat = (d.category || d.folder || d.type || "").toLowerCase();
        const tags = Array.isArray(d.tags) ? d.tags.join(" ").toLowerCase() : (d.tags || "").toLowerCase();
        const uploader = (d.uploaderName || d.uploadedBy || "").toLowerCase();
        return title.includes(termLower) || cat.includes(termLower) || tags.includes(termLower) || uploader.includes(termLower);
      })
      .slice(0, 5)
      .map((d) => ({
        id: d.$id,
        title: d.title || d.name || d.filename || "Untitled Document",
        subtitle: `${d.category || "General"} • ${d.fileType || d.ext || "PDF"} ${d.$createdAt ? `• ${new Date(d.$createdAt).toLocaleDateString()}` : ""}`,
        type: "document",
        url: d.fileUrl || d.url || `/admin/documents?id=${d.$id}`,
        badge: d.category || "Document",
        fileType: d.fileType || d.ext || "pdf",
      }));

    // 8. Process and filter Transactions
    const rawTx = txRes.status === "fulfilled" ? txRes.value.documents : [];
    const transactions = rawTx
      .filter((t) => {
        if (coopId && t.coopId && t.coopId !== coopId) return false;
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
        url: `/admin/finances?ref=${t.$id}`,
        badge: t.status || "Transaction",
      }));

    // 9. Process and filter Assembly Resolutions
    const rawAssemblies = assembliesRes.status === "fulfilled" ? assembliesRes.value.documents : [];
    const resolutions = rawAssemblies
      .filter((a) => {
        if (coopId && a.coopId && a.coopId !== coopId) return false;
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
        url: `/admin/assembly?id=${a.$id}`,
        badge: "Resolution",
      }));

    // 10. Process and filter Applications
    const rawApps = appsRes.status === "fulfilled" ? appsRes.value.documents : [];
    const applications = rawApps
      .filter((ap) => {
        if (coopId && ap.coopId && ap.coopId !== coopId) return false;
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
        url: `/admin/applications?id=${ap.$id}`,
        badge: ap.status || "Application",
      }));

    // 11. Return clean grouped search JSON response
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
    console.error("Global search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to perform search query" },
      { status: 500 }
    );
  }
}
