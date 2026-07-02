const Counter = require('../models/Counter');

async function generateQrId() {
  const year = new Date().getFullYear();

  const counter = await Counter.findOneAndUpdate(
    { name: `qrId-${year}` },
    {
      $inc: { seq: 1 },
      $setOnInsert: {
        name: `qrId-${year}`,
        seq: 0
      }
    },
    {
      upsert: true,
      new: true
    }
  );

  const sequence = String(counter.seq).padStart(7, '0');

  return `TUNW-QR-${year}-${sequence}`;
}

module.exports = generateQrId;