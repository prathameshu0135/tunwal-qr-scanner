const axios = require('axios');

function cleanMobileNumber(mobile) {
  const cleaned = String(mobile || '').replace(/\D/g, '');

  // If someone passes +91xxxxxxxxxx or 91xxxxxxxxxx, keep last 10 digits
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned.slice(2);
  }

  return cleaned;
}

async function sendOtpVia2Factor(mobile, otp) {
  const apiKey = process.env.TWO_FACTOR_API_KEY;

  if (!apiKey) {
    throw new Error('TWO_FACTOR_API_KEY missing in environment');
  }

  const cleanMobile = cleanMobileNumber(mobile);
  const cleanOtp = String(otp || '').trim();

  if (!/^[0-9]{10}$/.test(cleanMobile)) {
    throw new Error('Mobile number must be 10 digits');
  }

  if (!/^[0-9]{4,8}$/.test(cleanOtp)) {
    throw new Error('OTP must be numeric and 4 to 8 digits');
  }

  const url = `https://2factor.in/API/V1/${apiKey}/SMS/${cleanMobile}/${cleanOtp}`;

  try {
    const response = await axios.post(url, null, {
      timeout: 15000
    });

    if (response.data?.Status !== 'Success') {
      throw new Error(response.data?.Details || '2Factor OTP failed');
    }

    return response.data;
  } catch (error) {
    console.error('2Factor OTP API Error:', {
      mobile: cleanMobile,
      status: error?.response?.status,
      data: error?.response?.data,
      message: error.message
    });

    throw error;
  }
}

async function sendOtpViaFast2Sms(mobile, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    throw new Error('FAST2SMS_API_KEY missing in environment');
  }

  const cleanMobile = cleanMobileNumber(mobile);

  const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
    params: {
      authorization: apiKey,
      variables_values: otp,
      route: process.env.FAST2SMS_ROUTE || 'otp',
      numbers: cleanMobile
    },
    timeout: 15000
  });

  if (response.data?.return === false) {
    throw new Error(response.data?.message || 'Fast2SMS returned failure');
  }

  return response.data;
}

async function sendOtpSms(mobile, otp) {
  const provider = String(process.env.SMS_PROVIDER || '2factor').toLowerCase();

  if (provider === '2factor') {
    return sendOtpVia2Factor(mobile, otp);
  }

  if (provider === 'fast2sms') {
    return sendOtpViaFast2Sms(mobile, otp);
  }

  throw new Error(`Unsupported SMS_PROVIDER: ${provider}`);
}

module.exports = {
  sendOtpSms
};