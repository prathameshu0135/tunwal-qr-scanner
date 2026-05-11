const ExcelJS = require('exceljs');
const Warranty = require('../models/Warranty');
const asyncHandler = require('../utils/asyncHandler');

const getWarrantyRecords = asyncHandler(async (req, res) => {
  const search = String(req.query.search || '').trim();

  const filter = search
    ? {
        $or: [
          { qrId: { $regex: search, $options: 'i' } },
          { scooterName: { $regex: search, $options: 'i' } },
          { scooterColor: { $regex: search, $options: 'i' } },
          { controllerNumber: { $regex: search, $options: 'i' } },
          { batteryNumber: { $regex: search, $options: 'i' } },
          { motorNumber: { $regex: search, $options: 'i' } },
          { chassisNumber: { $regex: search, $options: 'i' } },
          { chargerNumber: { $regex: search, $options: 'i' } },
          { dealerName: { $regex: search, $options: 'i' } },
          { customerName: { $regex: search, $options: 'i' } },
          { contactNumber: { $regex: search, $options: 'i' } },
          { dealerAddress: { $regex: search, $options: 'i' } },
          { state: { $regex: search, $options: 'i' } }
        ]
      }
    : {};

  const records = await Warranty.find(filter).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: records.length,
    data: records
  });
});

const getWarrantyDetail = asyncHandler(async (req, res) => {
  const qrId = String(req.params.qrId || '').trim().toUpperCase();

  const warranty = await Warranty.findOne({ qrId });

  if (!warranty) {
    return res.status(404).json({
      success: false,
      message: 'Warranty record not found'
    });
  }

  res.json({
    success: true,
    data: warranty
  });
});

const updateWarrantyDetail = asyncHandler(async (req, res) => {
  const qrId = String(req.params.qrId || '').trim().toUpperCase();

  const warranty = await Warranty.findOne({ qrId });

  if (!warranty) {
    return res.status(404).json({
      success: false,
      message: 'Warranty record not found'
    });
  }

  const {
    scooterName,
    scooterColor,
    controllerNumber,
    batteryNumber,
    motorNumber,
    chassisNumber,
    chargerNumber,
    dealerName,
    dealerAddress,
    state,
    dateOfSale,
    customerName,
    contactNumber
  } = req.body;

  if (
    !scooterName ||
    !scooterColor ||
    !controllerNumber ||
    !batteryNumber ||
    !motorNumber ||
    !chassisNumber ||
    !chargerNumber ||
    !dealerName ||
    !dealerAddress ||
    !state ||
    !dateOfSale ||
    !customerName ||
    !contactNumber
  ) {
    return res.status(400).json({
      success: false,
      message: 'All warranty fields are required'
    });
  }

  if (!/^[0-9]{10}$/.test(String(contactNumber).trim())) {
    return res.status(400).json({
      success: false,
      message: 'Contact number must be a valid 10 digit number'
    });
  }

  const normalizedController = String(controllerNumber).trim().toUpperCase();
  const normalizedBattery = String(batteryNumber).trim().toUpperCase();
  const normalizedMotor = String(motorNumber).trim().toUpperCase();
  const normalizedChassis = String(chassisNumber).trim().toUpperCase();
  const normalizedCharger = String(chargerNumber).trim().toUpperCase();

  const duplicateMotor = await Warranty.findOne({
    qrId: { $ne: qrId },
    motorNumber: normalizedMotor
  });

  if (duplicateMotor) {
    return res.status(400).json({
      success: false,
      message: 'Motor number already registered with another QR'
    });
  }

  const duplicateChassis = await Warranty.findOne({
    qrId: { $ne: qrId },
    chassisNumber: normalizedChassis
  });

  if (duplicateChassis) {
    return res.status(400).json({
      success: false,
      message: 'Chassis number already registered with another QR'
    });
  }

  const duplicateBattery = await Warranty.findOne({
    qrId: { $ne: qrId },
    batteryNumber: normalizedBattery
  });

  if (duplicateBattery) {
    return res.status(400).json({
      success: false,
      message: 'Battery number already registered with another QR'
    });
  }

  warranty.scooterName = String(scooterName).trim();
  warranty.scooterColor = String(scooterColor).trim();

  warranty.controllerNumber = normalizedController;
  warranty.batteryNumber = normalizedBattery;
  warranty.motorNumber = normalizedMotor;
  warranty.chassisNumber = normalizedChassis;
  warranty.chargerNumber = normalizedCharger;

  warranty.dealerName = String(dealerName).trim();
  warranty.dealerAddress = String(dealerAddress).trim();
  warranty.state = String(state).trim();
  warranty.dateOfSale = dateOfSale;

  warranty.customerName = String(customerName).trim();
  warranty.contactNumber = String(contactNumber).trim();

  await warranty.save();

  res.json({
    success: true,
    message: 'Warranty record updated successfully',
    data: warranty
  });
});

const exportWarrantyExcel = asyncHandler(async (req, res) => {
  const records = await Warranty.find().sort({ createdAt: -1 }).lean();

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Warranty Records');

  worksheet.columns = [
    { header: 'QR ID', key: 'qrId', width: 22 },
    { header: 'Scooter Name', key: 'scooterName', width: 25 },
    { header: 'Scooter Color', key: 'scooterColor', width: 18 },
    { header: 'Controller Number', key: 'controllerNumber', width: 24 },
    { header: 'Battery Number', key: 'batteryNumber', width: 24 },
    { header: 'Motor Number', key: 'motorNumber', width: 24 },
    { header: 'Chassis Number', key: 'chassisNumber', width: 24 },
    { header: 'Charger Number', key: 'chargerNumber', width: 24 },
    { header: 'Dealer Name', key: 'dealerName', width: 28 },
    { header: 'Dealer Address', key: 'dealerAddress', width: 40 },
    { header: 'State', key: 'state', width: 20 },
    { header: 'Date of Sale', key: 'dateOfSale', width: 18 },
    { header: 'Customer Name', key: 'customerName', width: 28 },
    { header: 'Contact Number', key: 'contactNumber', width: 18 },
    { header: 'Registered At', key: 'createdAt', width: 24 },
    { header: 'Last Updated At', key: 'updatedAt', width: 24 }
  ];

  records.forEach((record) => {
    worksheet.addRow({
      qrId: record.qrId,
      scooterName: record.scooterName,
      scooterColor: record.scooterColor,
      controllerNumber: record.controllerNumber,
      batteryNumber: record.batteryNumber,
      motorNumber: record.motorNumber,
      chassisNumber: record.chassisNumber,
      chargerNumber: record.chargerNumber,
      dealerName: record.dealerName,
      dealerAddress: record.dealerAddress,
      state: record.state,
      dateOfSale: record.dateOfSale
        ? new Date(record.dateOfSale).toLocaleDateString('en-IN')
        : '',
      customerName: record.customerName,
      contactNumber: record.contactNumber,
      createdAt: record.createdAt
        ? new Date(record.createdAt).toLocaleString('en-IN')
        : '',
      updatedAt: record.updatedAt
        ? new Date(record.updatedAt).toLocaleString('en-IN')
        : ''
    });
  });

  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).height = 22;

  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
        wrapText: true
      };
    });
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );

  res.setHeader(
    'Content-Disposition',
    'attachment; filename=warranty-records.xlsx'
  );

  await workbook.xlsx.write(res);
  res.end();
});

module.exports = {
  getWarrantyRecords,
  getWarrantyDetail,
  updateWarrantyDetail,
  exportWarrantyExcel
};