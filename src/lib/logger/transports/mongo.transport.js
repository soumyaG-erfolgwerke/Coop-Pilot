import Transport from 'winston-transport';
import { connectToDatabase } from '../../db/mongoose.js';
import SystemLog from '../../models/SystemLog.model.js';
import AuditLog from '../../models/AuditLog.model.js';
import AnalyticsLog from '../../models/AnalyticsLog.model.js';

/**
 * MongoTransport — Custom Winston Transport
 *
 * Writes log entries to the correct MongoDB collection based on
 * the `logTarget` field in the log metadata:
 *   - 'system'    → system_logs    (default)
 *   - 'audit'     → audit_logs
 *   - 'analytics' → analytics_logs
 */
export class MongoTransport extends Transport {
  constructor(opts = {}) {
    super(opts);
    this.name = 'MongoTransport';
  }

  /**
   * Called by Winston for each log entry.
   * `info` is the full log object including all custom fields.
   * `callback` must be called when done (Winston flow control).
   */
  async log(info, callback) {
    // Tell Winston this transport has received the entry
    setImmediate(() => this.emit('logged', info));

    try {
      // Ensure DB is connected before writing
      await connectToDatabase();

      // Pick model based on logTarget field
      const Model = this._resolveModel(info.logTarget);

      // Build the MongoDB document from Winston's log info
      const doc = {
        timestamp:   info.timestamp   || new Date(),
        eventType:   info.eventType   || 'GENERIC',
        category:    info.category    || 'SYSTEM',
        source:      info.source      || 'nextjs-server',
        actorId:     info.actorId     || null,
        entityType:  info.entityType  || null,
        entityId:    info.entityId    || null,
        severity:    info.severity    || info.level?.toUpperCase() || 'INFO',
        message:     info.message,
        metadata:    info.metadata    || null,
        requestId:   info.requestId   || null,
        sessionId:   info.sessionId   || null,
        environment: info.environment || process.env.NEXT_PUBLIC_NODE_ENV || 'development',
      };

      // Await database write to prevent serverless execution context freeze before logging completes
      await Model.create(doc).catch((err) => {
        console.error('[MongoTransport] Write failed:', err.message);
      });

    } catch (err) {
      console.error('[MongoTransport] Critical failure:', err.message);
    }

    // Always call callback — even on error — so Winston pipeline keeps flowing
    callback();
  }

  /**
   * Resolves the correct Mongoose model for a given log target.
   *
   * @param {'system'|'audit'|'analytics'} target
   * @returns {mongoose.Model}
   */
  _resolveModel(target) {
    switch (target) {
      case 'audit':     return AuditLog;
      case 'analytics': return AnalyticsLog;
      case 'system':
      default:          return SystemLog;
    }
  }
}
