import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${(error as Error).message}`);
    console.error(`[MongoDB] Continuing without database connection.`);
    // Disable buffering globally so DB ops fail-fast instead of hanging
    mongoose.set('bufferCommands', false);
  }
};
