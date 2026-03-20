import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("Define MONGODB_URI in .env.local");

declare global {
  var _mongooseConn: typeof mongoose | null;
  var _mongoosePromise: Promise<typeof mongoose> | null;
}

export async function connectDB() {
  if (global._mongooseConn) return global._mongooseConn;
  if (!global._mongoosePromise) {
    global._mongoosePromise = mongoose.connect(MONGODB_URI, { bufferCommands: false, maxPoolSize: 10 });
  }
  try {
    global._mongooseConn = await global._mongoosePromise;
    return global._mongooseConn;
  } catch (e) {
    global._mongoosePromise = null;
    throw e;
  }
}
export default connectDB;
