import dotenv from 'dotenv';
import path from 'path';

// Load .env from root directory
dotenv.config({ path: path.join(__dirname, '../../../.env') });

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb+srv://sakshicharlewar9_db_user:Sakshi%402007@cluster0.4rgr519.mongodb.net/mockmate?retryWrites=true&w=majority&appName=Cluster0',
};
