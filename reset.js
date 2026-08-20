import fs from 'fs';
import { Client, Databases } from 'node-appwrite';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key) acc[key.trim()] = val.join('=').trim().replace(/"/g, '');
  return acc;
}, {});

const client = new Client();
client
  .setEndpoint(env.APPWRITE_ENDPOINT)
  .setProject(env.APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function reset() {
  try {
    const result = await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      '683f21190030cfd38fce', // COLLECTION_ID_COOPERATIVES
      'demo_bea_cooperative',
      {
        auditStatus: 'NOT_STARTED',
        auditFormId: null,
        auditJson: null
      }
    );
    console.log("Success! Status reset to NOT_STARTED");
  } catch (error) {
    console.error("Error:", error);
  }
}
reset();
