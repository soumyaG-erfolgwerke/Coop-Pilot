import mongoose from 'mongoose';

/**
 * Schema for system_logs collection.
 * Stores: INFO, WARN, ERROR, CRITICAL level events
 * from server components, API routes, and background jobs.
 */
const SystemLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,              // Fast range queries by time
    },
    eventType: {
      type: String,
      required: true,
      maxlength: 100,
      index: true,              // Filter by event type e.g. "USER_LOGIN"
    },
    category: {
      type: String,
      required: true,
      maxlength: 50,
      enum: [
        'AUTH', 'API', 'DATABASE', 'APPWRITE',
        'USER_ACTION', 'SYSTEM', 'BACKGROUND_JOB',
        'SECURITY', 'PERFORMANCE',
      ],
      index: true,
    },
    source: {
      type: String,
      default: 'nextjs-server',
      maxlength: 50,
    },
    actorId: {
      type: String,
      maxlength: 100,
      index: true,              // Find all logs for a specific user
      default: null,
    },
    entityType: {
      type: String,
      maxlength: 50,
      default: null,            // e.g. "project", "invoice"
    },
    entityId: {
      type: String,
      maxlength: 100,
      default: null,            // The ID of the target document
    },
    severity: {
      type: String,
      required: true,
      enum: ['INFO', 'WARN', 'ERROR', 'CRITICAL'],
      default: 'INFO',
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,  // Stores any JSON object
      default: null,
    },
    requestId: {
      type: String,
      maxlength: 50,
      index: true,              // Trace all logs within one HTTP request
      default: null,
    },
    sessionId: {
      type: String,
      maxlength: 1000,
      default: null,
    },
    environment: {
      type: String,
      required: true,
      enum: ['production', 'development', 'test'],
      default: process.env.NEXT_PUBLIC_NODE_ENV || 'development',
    },
  },
  {
    timestamps: false,          // We manage `timestamp` manually
    collection: process.env.SYSTEM_COLLECTION || 'system_logs',
    versionKey: false,          // Removes __v field from documents
  }
);

// TTL index: auto-delete documents older than 90 days in production
SystemLogSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90, name: 'ttl_90_days' }
);

// Prevent model re-registration in Next.js hot reload
export default mongoose.models.SystemLog ||
  mongoose.model('SystemLog', SystemLogSchema);
