const mongoose = require('mongoose');

const warrantySchema = new mongoose.Schema(
  {
    qrId: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },

    scooterName: {
      type: String,
      required: true,
      trim: true
    },

    scooterColor: {
      type: String,
      required: true,
      trim: true
    },

    controllerNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },

    batteryNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },

    motorNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },

    chassisNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },

    chargerNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },

    dealerName: {
      type: String,
      required: true,
      trim: true
    },

    customerName: {
      type: String,
      required: true,
      trim: true
    },

    contactNumber: {
      type: String,
      required: true,
      trim: true
    },

    dateOfSale: {
      type: Date,
      required: true
    },

    dealerAddress: {
      type: String,
      required: true,
      trim: true
    },

    state: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

/* ===========================
   UNIQUE INDEXES
=========================== */

warrantySchema.index({ qrId: 1 }, { unique: true });

warrantySchema.index({ controllerNumber: 1 }, { unique: true });

warrantySchema.index({ batteryNumber: 1 }, { unique: true });

warrantySchema.index({ motorNumber: 1 }, { unique: true });

warrantySchema.index({ chassisNumber: 1 }, { unique: true });

warrantySchema.index({ chargerNumber: 1 }, { unique: true });

/* ===========================
   SEARCH INDEXES
=========================== */

warrantySchema.index({ scooterName: 1 });

warrantySchema.index({ dealerName: 1 });

warrantySchema.index({ customerName: 1 });

warrantySchema.index({ contactNumber: 1 });

warrantySchema.index({ state: 1 });

warrantySchema.index({ createdAt: -1 });

warrantySchema.index({ dateOfSale: -1 });

warrantySchema.index({ state: 1, createdAt: -1 });

warrantySchema.index({ dealerName: 1, createdAt: -1 });

warrantySchema.index({ customerName: 1, contactNumber: 1 });

module.exports = mongoose.model('Warranty', warrantySchema);