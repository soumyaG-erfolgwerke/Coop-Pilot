import { Client } from "appwrite";

// Retrieve credentials from environment variables
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID_MESSAGE = "686f7bb40012db746c90";

// Basic validation
if (!endpoint || !projectId) {
  throw new Error(
    "Appwrite endpoint or project ID is missing. Check your .env file."
  );
}

const client = new Client();
client.setEndpoint(endpoint).setProject(projectId); // Optional: only needed for admin-level functions

export function initRealtimeMesseging({ onCreate, onUpdate, currentid }) {
  // The subscribe method returns an unsubscribe function
  const unsubscribe = client.subscribe(
    `databases.${DATABASE_ID}.collections.${COLLECTION_ID_MESSAGE}.documents`,
    (response) => {
      // Check for a 'create' event
      if (
        response.events.includes("databases.*.collections.*.documents.*.create")
      ) {
        // console.log("📢 Realtime Create Event:", response.payload,currentid);
        // Call the onCreate callback if it was provided
        if (
          response.payload.sender === currentid ||
          response.payload.receiver === currentid
        ) {
          onCreate?.(response.payload);
        }
      }

      // Check for an 'update' event
      if (
        response.events.includes("databases.*.collections.*.documents.*.update")
      ) {
        // console.log("📢 Realtime Update Event:", response.payload,currentid);
        if (
          response.payload.sender === currentid ||
          response.payload.receiver === currentid
        ) {
          onUpdate?.(response.payload);
        }
      }
    }
  );
  return unsubscribe;
}
