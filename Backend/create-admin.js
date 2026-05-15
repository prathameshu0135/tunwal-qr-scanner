require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Admin = require('./src/models/admin');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const username = 'admin';
    const email = 'admin@tunwal.local';
    const password = 'Admin@123';

    const passwordHash = await bcrypt.hash(password, 10);

    await Admin.findOneAndUpdate(
      {
        $or: [
          { username },
          { email }
        ]
      },
      {
        name: 'Super Admin',
        username,
        email,
        passwordHash,
        role: 'superadmin',
        isActive: true
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    console.log('Admin updated successfully');
    console.log('Username:', username);
    console.log('Email:', email);
    console.log('Password:', password);

    process.exit(0);
  } catch (error) {
    console.error('Admin update failed:', error);
    process.exit(1);
  }
}

run();  