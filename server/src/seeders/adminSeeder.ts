import Admin from '../models/Admin';

/**
 * Seeds the default admin account on first server startup.
 * Creates admin001 / Admin@123 if no admin exists in the collection.
 */
export const seedDefaultAdmin = async (): Promise<void> => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0) {
      console.log('[Admin Seeder] Admin account already exists — skipping seed.');
      return;
    }

    const defaultAdmin = new Admin({
      adminId: 'admin001',
      name: 'Super Admin',
      email: 'admin@mockmate.com',
      password: 'Admin@123',       // will be bcrypt-hashed by pre-save hook
      role: 'SUPER_ADMIN',
      isActive: true,
    });

    await defaultAdmin.save();
    console.log('[Admin Seeder] ✅ Default admin created — ID: admin001 | Email: admin@mockmate.com');
  } catch (error) {
    console.error('[Admin Seeder] ❌ Failed to seed default admin:', error);
  }
};
