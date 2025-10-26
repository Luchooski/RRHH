import mongoose, { type Connection } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error('Missing env: MONGODB_URI');

let cached = (global as any)._mongooseConn as
  | { conn: Connection | null; promise: Promise<Connection> | null }
  | undefined;
if (!cached) cached = (global as any)._mongooseConn = { conn: null, promise: null };

export async function connectDB(): Promise<Connection> {
  if (cached!.conn) return cached!.conn;

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URI, {
      autoIndex: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000
    }).then(m => m.connection);
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
}

export function getConnection(): Connection {
  const conn = mongoose.connection;
  if (!conn || conn.readyState === 0) {
    throw new Error('DB not connected yet. Call connectDB() first.');
  }
  return conn;
}
