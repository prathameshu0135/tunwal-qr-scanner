const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: 'Super Admin',
      trim: true
    },

    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      lowercase: true,
      trim: true
    },

    email: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      index: true,
      lowercase: true,
      trim: true
    },

    passwordHash: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ['superadmin', 'admin'],
      default: 'superadmin'
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);