import { NextResponse } from "next/server";
import { Query, ID } from "node-appwrite";
import { InputFile } from "node-appwrite/file";
import { cookies } from "next/headers";
import {
  createAdminClient,
  DATABASE_ID,
  COLLECTION_ID_ONBOARDINGLOGs,
  COLLECTION_ID_ONBOARDED_MEMBERS,
  COLLECTION_ID_PROFILE,
  AUDIT_BUCKET_ID,
  ENDPOINT,
  PROJECT_ID,
} from "@/lib/appwrite-server";

// Helper to parse CSV content safely
function parseCSV(text) {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return [];

  // Headers line
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    let current = [];
    let inQuotes = false;
    let temp = '';

    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        current.push(temp.trim().replace(/^"|"$/g, ''));
        temp = '';
      } else {
        temp += char;
      }
    }
    current.push(temp.trim().replace(/^"|"$/g, ''));

    if (current.length >= headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = current[index];
      });
      rows.push(row);
    }
  }
  return rows;
}

// Case-insensitive header extractor
function getHeaderValue(row, possibleNames) {
  for (const name of possibleNames) {
    const key = Object.keys(row).find(
      k => k.toLowerCase().replace(/[\s_-]/g, '') === name.toLowerCase().replace(/[\s_-]/g, '')
    );
    if (key && row[key] !== undefined) return row[key];
  }
  return null;
}

// Helper to validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper to parse CSV date in dd-mm-yyyy or other formats
function parseCSVDate(dateStr) {
  if (!dateStr) return null;
  const cleaned = dateStr.trim();

  // Match dd-mm-yyyy, dd/mm/yyyy, or dd.mm.yyyy
  const dmyMatch = cleaned.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1; // 0-indexed month
    const year = parseInt(dmyMatch[3], 10);
    const date = new Date(year, month, day);
    if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
      return date.toISOString();
    }
  }

  // Fallback to standard JS parsing (e.g., yyyy-mm-dd)
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return null;
}

export async function POST(request) {
  try {
    const { databases, storage } = createAdminClient();

    // 1. Authenticate user and get onboardedBy email
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("appwrite-session");
    if (!sessionCookie?.value) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const sessionData = JSON.parse(sessionCookie.value);
    const adminUserId = sessionData.userId;

    const profilesResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_PROFILE,
      [Query.equal("userId", adminUserId)]
    );
    if (profilesResult.documents.length === 0) {
      return NextResponse.json({ success: false, error: "Admin profile not found" }, { status: 404 });
    }
    const adminProfile = profilesResult.documents[0];
    if (adminProfile.role !== "coopadmin") {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }
    const onboardedBy = adminProfile.contactEmail || adminProfile.email || "unknown@coop.de";

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // BULK ONBOARDING
      const formData = await request.formData();
      const file = formData.get("file");
      const coopId = formData.get("coopId");

      if (!file || !(file instanceof File)) {
        return NextResponse.json({ success: false, error: "No valid CSV file uploaded" }, { status: 400 });
      }
      if (file.size === 0) {
        return NextResponse.json({ success: false, error: "Empty file not allowed" }, { status: 400 });
      }
      if (!coopId) {
        return NextResponse.json({ success: false, error: "Missing coopId" }, { status: 400 });
      }

      // Parse CSV contents
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) {
        return NextResponse.json({ success: false, error: "CSV file is empty or invalid" }, { status: 400 });
      }

      const errors = [];
      const validatedRows = [];
      const seenEmails = new Set();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // Row 1 is header row

        const email = getHeaderValue(row, ['Email', 'memberEmail', 'mail']);
        const membershipId = getHeaderValue(row, ['MembershipId', 'membership_id', 'membership id']);
        const sharesStr = getHeaderValue(row, ['shares', 'Shares']);
        const joinedDateStr = getHeaderValue(row, ['joining date', 'joinedDate', 'joined date', 'date']);
        const name = getHeaderValue(row, ['Name', 'name', 'fullName', 'full name']);

        const rowErrors = [];

        // Validate email
        if (!email) {
          rowErrors.push("Email is required");
        } else {
          const trimmedEmail = email.trim();
          if (!isValidEmail(trimmedEmail)) {
            rowErrors.push(`Invalid email format ("${email}")`);
          }
          if (seenEmails.has(trimmedEmail.toLowerCase())) {
            rowErrors.push(`Duplicate email in CSV ("${email}")`);
          } else {
            seenEmails.add(trimmedEmail.toLowerCase());
          }
        }

        // Validate shares
        let shares = 0;
        if (sharesStr !== null && sharesStr !== undefined && sharesStr.trim() !== '') {
          const trimmedShares = sharesStr.trim();
          const parsedShares = Number(trimmedShares);
          if (!/^\d+$/.test(trimmedShares) || isNaN(parsedShares) || parsedShares < 0) {
            rowErrors.push(`Shares must be a non-negative integer ("${sharesStr}")`);
          } else {
            shares = parsedShares;
          }
        }

        // Validate joinedDate
        let joinedDate = null;
        if (joinedDateStr && joinedDateStr.trim() !== '') {
          joinedDate = parseCSVDate(joinedDateStr);
          if (!joinedDate) {
            rowErrors.push(`Invalid date format (expected dd-mm-yyyy or yyyy-mm-dd, got "${joinedDateStr}")`);
          }
        } else {
          joinedDate = new Date().toISOString();
        }

        if (rowErrors.length > 0) {
          errors.push(`Row ${rowNum}: ${rowErrors.join(", ")}`);
        } else if (email) {
          validatedRows.push({
            email: email.trim(),
            membershipId: (membershipId || "").trim(),
            shares,
            joinedDate,
            name: name ? name.trim() : "",
          });
        }
      }

      // Check duplicates against the database and filter them out
      const rowsToInsert = [];
      const skippedDuplicates = [];

      if (errors.length === 0) {
        const emailsToVerify = validatedRows.map((r) => r.email);
        const existingEmails = new Set();
        const BATCH_SIZE = 100;

        for (let i = 0; i < emailsToVerify.length; i += BATCH_SIZE) {
          const emailBatch = emailsToVerify.slice(i, i + BATCH_SIZE);
          try {
            const result = await databases.listDocuments(
              DATABASE_ID,
              COLLECTION_ID_ONBOARDED_MEMBERS,
              [
                Query.equal("coopId", coopId),
                Query.equal("memberEmail", emailBatch),
                Query.limit(BATCH_SIZE),
              ]
            );
            result.documents.forEach((doc) => {
              if (doc.memberEmail) {
                existingEmails.add(doc.memberEmail.toLowerCase());
              }
            });
          } catch (err) {
            console.error("Failed to fetch batch of existing onboarded members:", err);
          }
        }

        for (const row of validatedRows) {
          if (existingEmails.has(row.email.toLowerCase())) {
            skippedDuplicates.push(row.email);
          } else {
            rowsToInsert.push(row);
          }
        }
      }

      if (errors.length > 0) {
        return NextResponse.json({
          success: false,
          error: "CSV validation failed",
          details: errors
        }, { status: 400 });
      }

      // Save only new members to COLLECTION_ID_ONBOARDED_MEMBERS in parallel chunks
      const savedMembers = [];
      const CHUNK_SIZE = 10;
      for (let i = 0; i < rowsToInsert.length; i += CHUNK_SIZE) {
        const chunk = rowsToInsert.slice(i, i + CHUNK_SIZE);
        const promises = chunk.map((row) =>
          databases.createDocument(
            DATABASE_ID,
            COLLECTION_ID_ONBOARDED_MEMBERS,
            ID.unique(),
            {
              coopId,
              memberEmail: row.email,
              membershipId: row.membershipId,
              shares: row.shares,
              joinedDate: row.joinedDate,
              hasOnboarded: false,
            }
          )
        );
        const results = await Promise.all(promises);
        savedMembers.push(...results);
      }

      let bulkUrl = null;
      let logDoc = null;

      // Only perform storage upload and logs update if we actually onboarded new members
      if (savedMembers.length > 0) {
        // Upload the CSV file to storage
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uploadedFile = await storage.createFile(
          AUDIT_BUCKET_ID,
          ID.unique(),
          InputFile.fromBuffer(buffer, file.name)
        );

        // Construct view URL
        bulkUrl = `${ENDPOINT}/storage/buckets/${AUDIT_BUCKET_ID}/files/${uploadedFile.$id}/view?project=${PROJECT_ID}`;

        // Create a single log entry of type BULK in COLLECTION_ID_ONBOARDINGLOGs
        logDoc = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID_ONBOARDINGLOGs,
          ID.unique(),
          {
            coopId,
            type: "BULK",
            for: "member",
            bulkUrl,
            inviteEmail: null,
            inviteFullName: null,
            hasProfile: false,
            onboarded: false,
            onboardedBy,
          }
        );
      }

      let message = `Successfully onboarded ${savedMembers.length} members in bulk.`;
      if (skippedDuplicates.length > 0) {
        message += ` ${skippedDuplicates.length} members were skipped as duplicates.`;
      }

      return NextResponse.json({
        success: true,
        message,
        warnings: skippedDuplicates.length > 0 ? skippedDuplicates : null,
        log: logDoc,
      });
    } else {
      // SOLO ONBOARDING
      const { coopId, name, email, membershipId, shares, joinedDate } = await request.json();

      if (!coopId || !email || !name) {
        return NextResponse.json({ success: false, error: "Missing required fields (coopId, email, name)" }, { status: 400 });
      }

      if (!isValidEmail(email)) {
        return NextResponse.json({ success: false, error: `Invalid email format: "${email}"` }, { status: 400 });
      }

      // Check duplicates against the database
      const existingMembers = await databases.listDocuments(
        DATABASE_ID,
        COLLECTION_ID_ONBOARDED_MEMBERS,
        [
          Query.equal("coopId", coopId),
          Query.equal("memberEmail", email)
        ]
      );
      if (existingMembers.documents.length > 0) {
        return NextResponse.json({ success: false, error: `Member with email "${email}" is already onboarded.` }, { status: 400 });
      }

      // Save member to COLLECTION_ID_ONBOARDED_MEMBERS
      const sharesNum = parseInt(shares, 10) || 0;
      if (sharesNum < 0) {
        return NextResponse.json({ success: false, error: "Shares must be a non-negative integer" }, { status: 400 });
      }
      let isoJoinedDate = new Date().toISOString();
      if (joinedDate) {
        const parsedDate = new Date(joinedDate);
        if (!isNaN(parsedDate.getTime())) {
          isoJoinedDate = parsedDate.toISOString();
        } else {
          return NextResponse.json({ success: false, error: `Invalid joinedDate: "${joinedDate}"` }, { status: 400 });
        }
      }

      const memberDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID_ONBOARDED_MEMBERS,
        ID.unique(),
        {
          coopId,
          memberEmail: email,
          membershipId: membershipId || "",
          shares: sharesNum,
          joinedDate: isoJoinedDate,
          hasOnboarded: false,
        }
      );

      // Create log entry in COLLECTION_ID_ONBOARDINGLOGs
      const logDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID_ONBOARDINGLOGs,
        ID.unique(),
        {
          coopId,
          type: "SOLO",
          for: "member",
          bulkUrl: null,
          inviteEmail: email,
          inviteFullName: name,
          hasProfile: false,
          onboarded: false,
          onboardedBy,
        }
      );

      return NextResponse.json({
        success: true,
        message: `Successfully onboarded member ${email}`,
        log: logDoc,
      });
    }
  } catch (error) {
    console.error("Error in onboard-member API route:", error);
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { databases } = createAdminClient();
    const { searchParams } = new URL(request.url);
    const coopId = searchParams.get("coopId");

    if (!coopId) {
      return NextResponse.json({ success: false, error: "Missing coopId" }, { status: 400 });
    }

    const logsResult = await databases.listDocuments(
      DATABASE_ID,
      COLLECTION_ID_ONBOARDINGLOGs,
      [
        Query.equal("coopId", coopId),
        Query.equal("for", "member"),
        Query.orderDesc("$createdAt"),
        Query.limit(100),
      ]
    );

    return NextResponse.json({
      success: true,
      data: logsResult.documents,
    });
  } catch (error) {
    console.error("Error fetching onboarding logs:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch logs" }, { status: 500 });
  }
}
