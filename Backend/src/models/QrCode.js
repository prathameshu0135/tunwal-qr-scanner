const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema(
  {
    qrId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },

    qrImageDataUrl: {
      type: String,
      default: ''
    },

    

    // Main public QR entry link.
    // This should open frontend resolver page: /qr/:qrId
    activationLink: {
      type: String,
      required: true
    },
    /*
      Main QR lifecycle status.
      Use this for admin-level QR control.
    */
    status: {
      type: String,
      enum: [
        'inactive',
        'active',
        'blocked',
        'expired',
        'transferred',
        'scrapped'
      ],
      default: 'inactive'
    },

    previousStatus: {
      type: String,
      enum: [
        'inactive',
        'active',
        'blocked',
        'expired',
        'transferred',
        'scrapped',
        ''
      ],
      default: ''
    },

    /*
      Warranty status.
      Warranty is mandatory.
      Actual warranty data is stored in Warranty.js, not here.
    */
    warrantyStatus: {
      type: String,
      enum: ['pending', 'registered'],
      default: 'pending'
    },

    warrantyRegisteredAt: {
      type: Date,
      default: null
    },

    createdBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Admin',
  required: true
},

ownerMobile: {
  type: String,
  default: ''
},

blockedReason: {
  type: String,
  default: ''
},

  },
  { timestamps: true }
);

/*
  Indexes for better performance when multiple users/admins hit APIs.
  Keep all indexes here.
  Do not use `index: true` or `unique: true` inside fields if the same index is declared here.
*/

// Unique QR lookup
qrCodeSchema.index({ qrId: 1 }, { unique: true });

// Dashboard counts / filters
qrCodeSchema.index({ status: 1 });
qrCodeSchema.index({ warrantyStatus: 1 });

// Admin lists / latest QR first
qrCodeSchema.index({ createdAt: -1 });

// Useful combined filters for dashboard/admin list
qrCodeSchema.index({ warrantyStatus: 1, createdAt: -1 });
qrCodeSchema.index({ status: 1, createdAt: -1 });

// Owner lookup if needed later
qrCodeSchema.index({ ownerMobile: 1 });

// Created by admin tracking
qrCodeSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('QrCode', qrCodeSchema);