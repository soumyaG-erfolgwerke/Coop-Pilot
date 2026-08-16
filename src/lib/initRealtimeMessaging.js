import { Client } from "appwrite";

// Retrieve credentials from environment variables
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const COLLECTION_ID_MESSAGE = "686f7bb40012db746c90";

export function initRealtimeMesseging({ onCreate, onUpdate, currentid }) {
  if (typeof window === "undefined" || !endpoint || !projectId || !DATABASE_ID) {
    return () => {};
  }
  const client = new Client().setEndpoint(endpoint).setProject(projectId);
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
