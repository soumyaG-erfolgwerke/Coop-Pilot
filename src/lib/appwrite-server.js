const sdk = require("node-appwrite");
import { logger, IS_SERVERLESS } from "./logger/index.js";

// Server-side only env vars (no NEXT_PUBLIC_ prefix)
const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

if (!endpoint || !projectId) {
  console.log(
    "Server-side Appwrite credentials missing. Check APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID in .env",
  );
}

const COLLECTION_TO_ENTITY_MAP = {
  "683f1d64000112836b66": "profile",
  "683f21190030cfd38fce": "cooperative",
  "686aa8f9000a3f6da744": "audit_comment",
  "contactus63736723685": "contact_us",
  "691bf8e40024f5c70f9e": "coop_registry",
  "691c036a001a08571924": "coop_platform_registry",
  "686933f20010d69f48d0": "sector",
  "68693a450037369e696c": "state",
  "691cb6500037001ff7d2": "mail",
  "689a0cd70004c43a5f4d": "ticket",
  "683f2692002574988b87": "transaction",
  "6910be6f002cb8b7b3e4": "voting",
  "686b3b2a00300509bcf7": "notification",
  "69d40812002f183fd39b": "kyc_application",
  "69d8f53e00047c95b3f4": "kyc_document",
  "69e31b9a0013bbc8c5e8": "profile_update_request",
  "cooperative_settings": "coop_settings",
  "cooperative_settings_audit": "coop_settings_audit",
  "69e754740021de20a45d": "document",
  "69e9ecbc00386c7d01b1": "group",
  "69e9edd5002dc41104a1": "group_member",
  "69e9ee32000fa3445340": "share",
  "auditlogs": "audit_log",
  "assemblies": "assembly",
  "assembly_attendance": "assembly_attendance",
  "assembly_votes": "assembly_votes",
  "niederschrift": "niederschrift",
  "assembly_proxy": "assembly_proxy",
  "6a14759100231d14797c": "audit_org",
  "6a15b7f200107facc85e": "coop_doc",
  "6a0df06a00300d947887": "coop_member",
  "6a0ff6020011244c3d36": "user_text_form",
  "6a157ccc00107facc85e": "pending_payout",
  "onboardinglogs": "onboarding_log",
  "6a1e76af001cf4c00655": "onboarded_member",
  "6a22aeed0011df905c33": "team_x_coop",
  "org_issues": "org_issue",
  "6a2251b1002bc22eb5f9": "org_comment",
  "6a215a8e001263605687": "audit_org_log",
  "6a14792200166dc53149": "audit_team_member",
  "6a184c0200214ea76983": "audit_history",
  "invitecoops": "invite_coops",
  "6a0b5e0f0000f09d48d2": "transactions_ledger",
  "6a22af860034d02ac243": "audit_discrepancy",
  "6a21c85f003c61e159c5": "coop_report",
  "6a2031b600253fdb2456": "audit_form",
  "6a26d814002db06ac93a": "current_audit_form",
  "6a259e3a000740b396c0": "mail_directory",
  "6a2653c2002b270e4149": "founding_audit_instance",
  "6a28e0e10022454f65f7": "founding_audit_member",
  "6a2e92560004b343d909": "suggestion",
  "6a2f78bb0028a7cfe14e": "notice_board"
};

function resolveEntityInfo(serviceName, methodName, args) {
  let entityType = null;
  let entityId = null;

  try {
    if (serviceName === 'Databases') {
      const collectionId = args[1];
      if (typeof collectionId === 'string') {
        entityType = COLLECTION_TO_ENTITY_MAP[collectionId] || collectionId;
      }
      if (['getDocument', 'updateDocument', 'deleteDocument', 'createDocument'].includes(methodName)) {
        const docId = args[2];
        if (typeof docId === 'string') {
          entityId = docId;
        }
      }
    } else if (serviceName === 'Storage') {
      entityType = 'file';
      const fileId = args[1];
      if (typeof fileId === 'string') {
        entityId = fileId;
      }
    } else if (serviceName === 'Users') {
      entityType = 'user';
      const userId = args[0];
      if (typeof userId === 'string') {
        entityId = userId;
      }
    } else if (serviceName === 'Account') {
      entityType = 'account';
    }
  } catch (e) {
    // ignore
  }

  return { entityType, entityId };
}

/**
 * Proxy wrapper to automatically intercept and log external Appwrite calls.
 */
function wrapWithLogging(serviceInstance, serviceName) {
  if (!serviceInstance) return serviceInstance;

  return new Proxy(serviceInstance, {
    get(target, prop, receiver) {
      const originalValue = Reflect.get(target, prop, receiver);

      if (typeof originalValue === 'function') {
        return function (...args) {
          const startTime = Date.now();
          const callId = Math.random().toString(36).substring(2, 10);
          const methodName = String(prop);
          const { entityType, entityId } = resolveEntityInfo(serviceName, methodName, args);

          // Log initiation of external call (concurrently to avoid blocking)
          const initLogPromise = logger.info({
            eventType: 'EXTERNAL_RESOURCE_CALL',
            category: 'DATABASE',
            message: `Initiated Appwrite ${serviceName}.${methodName}`,
            entityType,
            entityId,
            metadata: {
              service: 'Appwrite',
              component: serviceName,
              method: methodName,
              callId,
              args: sanitizeArgs(methodName, args),
            }
          }).catch((err) => {
            console.error('[Logger] Appwrite initiation logging failed:', err.message);
          });

          return Promise.resolve(originalValue.apply(target, args))
            .then(async (result) => {
              if (IS_SERVERLESS) {
                try {
                  await initLogPromise;
                } catch {}
              }
              const duration = Date.now() - startTime;
              const successLogPromise = logger.info({
                eventType: 'EXTERNAL_RESOURCE_SUCCESS',
                category: 'DATABASE',
                message: `Completed Appwrite ${serviceName}.${methodName} in ${duration}ms`,
                entityType,
                entityId,
                metadata: {
                  service: 'Appwrite',
                  component: serviceName,
                  method: methodName,
                  callId,
                  durationMs: duration
                }
              });
              if (IS_SERVERLESS) {
                try {
                  await successLogPromise;
                } catch (err) {
                  console.error('[Logger] Appwrite success logging failed:', err.message);
                }
              }
              return result;
            })
            .catch(async (error) => {
              if (IS_SERVERLESS) {
                try {
                  await initLogPromise;
                } catch {}
              }
              const duration = Date.now() - startTime;
              const failureLogPromise = logger.error({
                eventType: 'EXTERNAL_RESOURCE_FAILURE',
                category: 'DATABASE',
                message: `Failed Appwrite ${serviceName}.${methodName} in ${duration}ms: ${error.message}`,
                entityType,
                entityId,
                metadata: {
                  service: 'Appwrite',
                  component: serviceName,
                  method: methodName,
                  callId,
                  durationMs: duration,
                  error: error.message
                }
              });
              if (IS_SERVERLESS) {
                try {
                  await failureLogPromise;
                } catch (err) {
                  console.error('[Logger] Appwrite failure logging failed:', err.message);
                }
              }
              throw error;
            });
        };
      }

      return originalValue;
    }
  });
}

function sanitizeArgs(methodName, args) {
  try {
    const methodLower = methodName.toLowerCase();
    if (methodLower.includes('password') || methodLower.includes('session') || methodLower.includes('create')) {
      return args.map(arg => {
        if (typeof arg === 'string') {
          return arg.length > 8 ? arg.slice(0, 3) + '...' : '***';
        }
        if (typeof arg === 'object' && arg !== null) {
          const sanitized = { ...arg };
          if ('password' in sanitized) sanitized.password = '***';
          if ('secret' in sanitized) sanitized.secret = '***';
          if ('key' in sanitized) sanitized.key = '***';
          return sanitized;
        }
        return arg;
      });
    }
    return args;
  } catch {
    return '[Unparseable Args]';
  }
}

// Create admin client with API key for server-side operations
const createAdminClient = () => {
  const client = new sdk.Client();

  if (endpoint && projectId && apiKey) {
    client.setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  }

  return {
    account: wrapWithLogging(new sdk.Account(client), 'Account'),
    databases: wrapWithLogging(new sdk.Databases(client), 'Databases'),
    users: wrapWithLogging(new sdk.Users(client), 'Users'),
    storage: wrapWithLogging(new sdk.Storage(client), 'Storage'),
  };
};

// Create session client for user-specific operations (using session token)
const createSessionClient = (session) => {
  const client = new sdk.Client();

  if (endpoint && projectId) {
    client.setEndpoint(endpoint).setProject(projectId).setSession(session);
  }

  return {
    account: wrapWithLogging(new sdk.Account(client), 'Account'),
    databases: wrapWithLogging(new sdk.Databases(client), 'Databases'),
    storage: wrapWithLogging(new sdk.Storage(client), 'Storage'),
  };
};

// Create basic client (no API key, no session) for auth operations like login/register
const createPublicClient = () => {
  const client = new sdk.Client();

  if (endpoint && projectId) {
    client.setEndpoint(endpoint).setProject(projectId);
  }

  return {
    account: wrapWithLogging(new sdk.Account(client), 'Account'),
    databases: wrapWithLogging(new sdk.Databases(client), 'Databases'),
  };
};

export {
  createAdminClient,
  createSessionClient,
  createPublicClient,
  appwriteFetchWithSession,
};

/**
 * Make an authenticated fetch to Appwrite using the session cookie value.
 * The node-appwrite SDK's setSession/X-Appwrite-Session does NOT work because
 * Appwrite only accepts session auth via Cookie or X-Fallback-Cookies headers.
 *
 * @param {string} cookieValue - The base64-encoded session cookie from Appwrite's Set-Cookie header
 * @param {string} path - API path e.g. "/account" or "/account/verifications/email"
 * @param {object} options - Additional fetch options (method, body, etc.)
 * @returns {Promise<Response>} - The fetch Response object
 */
async function appwriteFetchWithSession(cookieValue, path, options = {}) {
  const cookieName = `a_session_${projectId}`;
  return fetch(`${endpoint}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
      Cookie: `${cookieName}=${cookieValue}`,
      ...options.headers,
    },
  });
}

// Constants for database/collection IDs (server-side only)
export const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
export const COLLECTION_ID_PROFILE = "683f1d64000112836b66";
export const COLLECTION_ID_COOPERATIVES = "683f21190030cfd38fce";
export const COLLECTION_ID_AUDITCOMMENTS = "686aa8f9000a3f6da744";
export const COLLECTION_ID_CONTACT_US = "contactus63736723685";
export const COLLECTION_ID_COOP_REGISTRY = "691bf8e40024f5c70f9e";
export const COLLECTION_ID_COOP_PLATFORM_REGISTRY = "691c036a001a08571924";
export const COLLECTION_ID_SECTORS = "686933f20010d69f48d0";
export const COLLECTION_ID_STATES = "68693a450037369e696c";
export const COLLECTION_ID_MAILS = "691cb6500037001ff7d2";
export const COLLECTION_ID_TICKETS = "689a0cd70004c43a5f4d";
export const COLLECTION_ID_TRANSACTION = "683f2692002574988b87";
export const COLLECTION_ID_VOTING = "6910be6f002cb8b7b3e4";
export const COLLECTION_ID_NOTIFICATION = "686b3b2a00300509bcf7";
export const COLLECTION_ID_KYC_APPLICATIONS = "69d40812002f183fd39b";
export const COLLECTION_ID_KYC_DOCUMENTS = "69d8f53e00047c95b3f4";
export const COLLECTION_ID_KYC = COLLECTION_ID_KYC_DOCUMENTS; // Compatibility alias for legacy APIs
export const COLLECTION_ID_PROFILE_UPDATE_REQUESTS = "69e31b9a0013bbc8c5e8";
export const COLLECTION_ID_COOP_CONFIG =
  process.env.APPWRITE_COLLECTION_ID_COOP_CONFIG || "cooperative_settings";
export const COLLECTION_ID_COOP_SETTINGS_AUDIT =
  process.env.APPWRITE_COLLECTION_ID_COOP_SETTINGS_AUDIT ||
  "cooperative_settings_audit";
export const COLLECTION_ID_DOCUMENTS = "69e754740021de20a45d";
export const COLLECTION_ID_GROUPS = "69e9ecbc00386c7d01b1";
export const COLLECTION_ID_GROUPMEMBERS = "69e9edd5002dc41104a1";
export const COLLECTION_ID_SHARE = "69e9ee32000fa3445340";
export const COLLECTION_ID_AUDITLOGS = "auditlogs";
export const COLLECTION_ID_ASSEMBLIES =
  process.env.APPWRITE_COLLECTION_ID_ASSEMBLIES || "assemblies";
export const COLLECTION_ID_ASSEMBLY_ATTENDANCE =
  process.env.APPWRITE_COLLECTION_ID_ASSEMBLY_ATTENDANCE ||
  "assembly_attendance";
export const COLLECTION_ID_ASSEMBLY_VOTES =
  process.env.APPWRITE_COLLECTION_ID_ASSEMBLY_VOTES || "assembly_votes";
export const COLLECTION_ID_NIEDERSCHRIFT = "niederschrift";
export const COLLECTION_ID_ASSEMBLY_PROXIES = "assembly_proxy";
export const AUDIT_BUCKET_ID = "6918a3360027dc0888aa";
export const AVV_BUCKET_id = "6a0e1c48002727530040";
export const REPORTS_BUCKET_ID = "6a219e1500295b588d14";
export const FOUNDING_AUDIT_BUCKET_ID = "6a2a473b002e25cb6423";
export const COLLECTION_ID_AUDIT_ORGS = "6a14759100231d14797c";
export const COLLECTION_ID_COOP_DOCS = "6a15b7f200107facc85e";
export const OTP_FUNCTION_ENDPOINT =
  "https://6904e91900013336efe5.fra.appwrite.run/";
export const COLLECTION_ID_COOPXMEMBER = "6a0df06a00300d947887";
export const COLLECTION_ID_USERTEXTFORM = "6a0ff6020011244c3d36";
export const COLLECTION_ID_PENDINGPAYOUTS = "6a157ccc00107facc85e";
export const COLLECTION_ID_ONBOARDINGLOGs = "onboardinglogs";
export const COLLECTION_ID_ONBOARDED_MEMBERS = "6a1e76af001cf4c00655";

export const COLLECTION_ID_TEAM_X_COOP = "6a22aeed0011df905c33";
export const COLLECTION_ID_ORG_ISSUES = "org_issues";
export const COLLECTION_ID_ORG_COMMENTS = "6a2251b1002bc22eb5f9";
export const COLLECTION_ID_AUDIT_ORG_LOGS = "6a215a8e001263605687";
export const COLLECTION_ID_AUDITTEAM_MEMBERS = "6a14792200166dc53149";
export const COLLECTION_ID_AUDIT_HISTORY = "6a184c0200214ea76983";
export const COLLECTION_ID_INVITE_COOPS = "invitecoops";
export const COLLECTION_ID_ONBOARDINGLOGS = "onboardinglogs";
export const COLLECTION_ID_TEAMXCOOP = "6a22aeed0011df905c33";
export const COLLECTION_ID_AUDIT_DISCREPANCY = "6a22af860034d02ac243";
export const COLLECTION_ID_COOP_REPORTS = "6a21c85f003c61e159c5";
export const COLLECTION_ID_AUDIT_FORMS = "6a2031b600253fdb2456";
export const COLLECTION_ID_CURRENT_AUDIT_FORM = "6a26d814002db06ac93a";
export const COLLECTION_ID_MAIL_DIRECTORY = "6a259e3a000740b396c0";
export const COLLECTION_ID_FOUNDING_AUDIT_INSTANCES = "6a2653c2002b270e4149";
export const COLLECTION_ID_FOUNDING_AUDIT_MEMBERS = "6a28e0e10022454f65f7";
export const COLLECTION_ID_SUGGESTIONS = "6a2e92560004b343d909";
export const COLLECTION_ID_NOTICEBOARD = "6a2f78bb0028a7cfe14e";

export const COLLECTION_ID_TRANSACTIONS_LEDGER = "6a0b5e0f0000f09d48d2";
export const COLLECTION_ID_COOP_PAYMENT_CREDENTIALS = "6a0c6e75001e8af5862b";
export const COLLECTION_ID_COOP_SUBSCRIPTIONS = "6a10b9e3002a52cd0446";
export const COLLECTION_ID_SUBSCRIPTION_PLANS = "6a0f45aa00064ed9c0cd";

export const ENDPOINT = endpoint;
export const PROJECT_ID = projectId;
