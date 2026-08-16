import mongoose from 'mongoose';

/**
 * Global connection cache.
 * In Next.js dev mode, module-level variables reset on hot reload.
 * Attaching to `global` prevents repeated connections.
 */
let cached = global._mongooseCache;

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

/**
 * Connect to MongoDB.
 * Returns existing connection if already connected.
 *
 * @returns {Promise<mongoose.Connection>}
 */
export async function connectToDatabase() {
  const mongodbUrl = process.env.MONGODB_URL;
  const mongodbName = process.env.MONGODB_NAME;
  if (!mongodbUrl) {
    throw new Error('MongoDB is not configured');
  }
  // Already connected — return immediately
  if (cached.conn) {
    return cached.conn;
  }

  // Connection in progress — wait for it
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,       // Don't queue commands if disconnected
      maxPoolSize: 10,             // Max simultaneous connections
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    if (mongodbName) {
      opts.dbName = mongodbName;
    }

    cached.promise = mongoose
      .connect(mongodbUrl, opts)
      .then((mongooseInstance) => {
        console.log('[MongoDB] Connected successfully');
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null;       // Reset on error so retry is possible
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
