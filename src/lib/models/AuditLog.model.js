import mongoose from 'mongoose';

/**
 * Schema for audit_logs collection.
 * Stores: User actions, data changes, authentication events.
 * These are kept permanently for compliance and security audit reasons.
 */
const AuditLogSchema = new mongoose.Schema(
  {
    timestamp:   { type: Date, default: Date.now, index: true },
    eventType:   { type: String, required: true, maxlength: 100, index: true },
    category:    {
      type: String, required: true, maxlength: 50,
      enum: [
        'AUTH', 'API', 'DATABASE', 'APPWRITE',
        'USER_ACTION', 'SYSTEM', 'BACKGROUND_JOB',
        'SECURITY', 'PERFORMANCE',
      ],
      index: true,
    },
    source:      { type: String, default: 'nextjs-server', maxlength: 50 },
    actorId:     { type: String, maxlength: 100, index: true, default: null },
    entityType:  { type: String, maxlength: 50,  default: null },
    entityId:    { type: String, maxlength: 100, default: null },
    severity:    { type: String, enum: ['INFO', 'WARN', 'ERROR', 'CRITICAL'], default: 'INFO' },
    message:     { type: String, required: true, maxlength: 1000 },
    metadata:    { type: mongoose.Schema.Types.Mixed, default: null },
    requestId:   { type: String, maxlength: 50,  index: true, default: null },
    sessionId:   { type: String, maxlength: 1000, default: null },
    environment: {
      type: String,
      enum: ['production', 'development', 'test'],
      default: process.env.NODE_ENV || 'development',
    },
  },
  {
    timestamps: false,
    collection: process.env.AUDIT_COLLECTION || 'audit_logs',
    versionKey: false,
  }
);

export default mongoose.models.AuditLog ||
  mongoose.model('AuditLog', AuditLogSchema);
