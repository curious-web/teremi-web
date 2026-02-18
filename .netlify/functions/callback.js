// netlify/functions/callback.js
const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event, context) => {
  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method not allowed',
    };
  }

  // Get the callback data from Safaricom
  const callbackData = event.body;

  // Log to console (visible in Netlify logs)
  console.log('M-Pesa Callback received:', callbackData);

  // Optionally write to a temporary file (will be lost after cold starts)
  try {
    const logFile = path.join('/tmp', 'M_PESAConfirmationResponse.txt');
    await fs.appendFile(logFile, callbackData + '\n');
  } catch (err) {
    console.error('Failed to write callback to file:', err);
    // Continue – we still return success to Safaricom
  }

  // Return the required confirmation response
  return {
    statusCode: 200,
    body: JSON.stringify({
      ResultCode: 0,
      ResultDesc: 'Confirmation Received Successfully',
    }),
  };
};
