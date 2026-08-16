import mongoose from 'mongoose';

/**
 * Schema for analytics_logs collection.
 * Stores: Frontend user interactions, page views, button clicks.
 * Typically sent from the browser via /api/analytics.
 */
const AnalyticsLogSchema = new mongoose.Schema(
  {
    timestamp:   { type: Date, default: Date.now, index: true },
    eventType:   { type: String, required: true, maxlength: 100, index: true },
    category:    { type: String, default: 'USER_ACTION', maxlength: 50, index: true },
    source:      { type: String, default: 'nextjs-client', maxlength: 50 },
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
    collection: process.env.ANALYTICS_COLLECTION || 'analytics_logs',
    versionKey: false,
  }
);

// TTL index: auto-delete documents older than 90 days in production
AnalyticsLogSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90, name: 'ttl_90_days' }
);

export default mongoose.models.AnalyticsLog ||
  mongoose.model('AnalyticsLog', AnalyticsLogSchema);
