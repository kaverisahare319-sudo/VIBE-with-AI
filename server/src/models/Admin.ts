import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdmin extends Document {
  adminId: string;
  email: string;
  password: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ADMIN';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AdminSchema = new Schema({
  adminId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['SUPER_ADMIN', 'ADMIN'], default: 'SUPER_ADMIN' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Async pre-save hashing
AdminSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(12);
  (this as any).password = await bcrypt.hash((this as any).password, salt);
});

AdminSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, (this as any).password);
};

const Admin = mongoose.model<IAdmin>('Admin', AdminSchema, 'admins');
export default Admin;
