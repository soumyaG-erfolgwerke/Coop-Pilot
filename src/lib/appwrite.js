// import { Client, Account, Databases ,Storage  } from 'appwrite';

// // Retrieve credentials from environment variables
// const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
// const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
// const devKey = process.env.NEXT_PUBLIC_APPWRITE_DEV_KEY;

// // Basic validation
// if (!endpoint || !projectId) {
//   console.warn("Appwrite endpoint or project ID is missing. Check your .env file.");
// }

// const client = new Client();

// if (endpoint && projectId) {
//   client
//       .setEndpoint(endpoint)
//       .setProject(projectId);
  
//   if (devKey) {
//     client.setDevKey(devKey);
//   }
// }

// // Export service instances
// export const account = new Account(client);
// export const databases = new Databases(client);
// export const storage = new Storage(client);
// export default client;