const bcrypt = require('bcryptjs');
const Admin = require('../models/admin');

async function seedAdmin() {
  const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.log('Admin seed skipped: ADMIN_USERNAME or ADMIN_PASSWORD missing');
    return;
  }

  const existing = await Admin.findOne({ username });

  if (existing) {
    existing.username = username;
    existing.email = undefined;
    existing.isActive = true;

    await existing.save();

    console.log(`Admin exists/updated: ${username}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await Admin.create({
    name: 'Super Admin',
    username,
    passwordHash,
    role: 'superadmin',
    isActive: true
  });

  console.log(`Seed admin created: ${username}`);
}

module.exports = seedAdmin;