/**
 * Run this script once to create the default admin account.
 * Usage: npx ts-node src/scripts/seedAdmin.ts
 */
import '../config/env';
import { connectDB } from '../config/db';
import Admin from '../models/Admin';

async function seed() {
  await connectDB();

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@mockmate.ai';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@MockMate2024';
  const adminName = process.env.ADMIN_NAME || 'MockMate Admin';

  const existing = await Admin.findOne({ email: adminEmail });
  if (existing) {
    console.log(`✅ Admin already exists: ${adminEmail}`);
    process.exit(0);
  }

  const admin = new Admin({ email: adminEmail, password: adminPassword, name: adminName, role: 'superadmin' });
  await admin.save();

  console.log('✅ Default admin created:');
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log('   ⚠️  Please change the password after first login!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
