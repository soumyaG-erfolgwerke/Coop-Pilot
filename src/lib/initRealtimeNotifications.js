import { Client } from "appwrite";

// Retrieve credentials from environment variables
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID_NOTIFICATION = "686b3b2a00300509bcf7";

// Basic validation
if (!endpoint || !projectId) {
  throw new Error(
    "Appwrite endpoint or project ID is missing. Check your .env file."
  );
}

const client = new Client();
client.setEndpoint(endpoint).setProject(projectId); // Optional: only needed for admin-level functions

export function initRealtimeNotifications({ onCreate }) {
  // ✅ subscribe returns an unsubscribe function
  const unsubscribe = client.subscribe(
    `databases.${DATABASE_ID}.collections.${COLLECTION_ID_NOTIFICATION}.documents`,
    (response) => {
      if (
        response.events.includes("databases.*.collections.*.documents.*.create")
      ) {
        // console.log("📢 Realtime Create Event:", response.payload);
        onCreate?.(response.payload);
      }
    }
  );

  return unsubscribe; // ✅ Return the unsubscribe function directly
}

