const axios = require('axios');

async function sendOtpSms(mobile, otp) {
  if (!mobile || !otp) {
    throw new Error('Mobile number and OTP are required');
  }

  if (!process.env.FAST2SMS_API_KEY) {
    throw new Error('FAST2SMS_API_KEY missing in environment');
  }

  const response = await axios.get('https://www.fast2sms.com/dev/bulkV2', {
    params: {
      authorization: process.env.FAST2SMS_API_KEY,
      variables_values: otp,
      route: process.env.FAST2SMS_ROUTE || 'otp',
      numbers: mobile
    },
    timeout: 15000
  });

  return response.data;
}

module.exports = {
  sendOtpSms
};