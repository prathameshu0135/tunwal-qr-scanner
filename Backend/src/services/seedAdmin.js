const bcrypt = require('bcryptjs');
const Admin = require('../models/admin');

async function seedAdmin() {
  const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.log('Admin seed skipped: ADMIN_USERNAME or ADMIN_PASSWORD missing');
    return;
  }

  const existing = await Admin.findOne({
    $or: [
      { username },
      ...(email ? [{ email }] : [])
    ]
  });

  if (existing) {
    let changed = false;

    if (!existing.username) {
      existing.username = username;
      changed = true;
    }

    if (email && !existing.email) {
      existing.email = email;
      changed = true;
    }

    if (existing.isActive === false) {
      existing.isActive = true;
      changed = true;
    }

    if (changed) {
      await existing.save();
      console.log(`Admin updated with username: ${username}`);
    } else {
      console.log(`Admin exists: ${existing.username || existing.email}`);
    }

    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await Admin.create({
    name: 'Super Admin',
    username,
    email: email || undefined,
    passwordHash,
    role: 'superadmin',
    isActive: true
  });

  console.log(`Seed admin created: ${username}`);
}

module.exports = seedAdmin;