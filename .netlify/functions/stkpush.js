// netlify/functions/stkpush.js
exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Parse incoming data (support both JSON and form-urlencoded)
  let phone, amount;
  const contentType = event.headers['content-type'] || '';

  try {
    if (contentType.includes('application/json')) {
      const body = JSON.parse(event.body);
      phone = body.phone;
      amount = body.amount;
    } else {
      // Assume application/x-www-form-urlencoded or raw
      const params = new URLSearchParams(event.body);
      phone = params.get('phone');
      amount = params.get('amount');
    }
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body' }),
    };
  }

  // Validate required fields
  if (!phone || !amount) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Phone number and amount are required' }),
    };
  }

  // Clean phone number (remove non-digits)
  const PartyA = phone.replace(/\D/g, '');

  // Set timezone to Nairobi
  const Timestamp = new Date().toLocaleString('en-US', { timeZone: 'Africa/Nairobi' });
  // Convert to YYYYMMDDHHMMSS format
  const date = new Date(Timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const formattedTimestamp = `${year}${month}${day}${hours}${minutes}${seconds}`;

  // Hardcoded credentials (as in original PHP)
  const consumerKey = 'FJPGBjWA7Vl3blMRoMSu8jSYHyUW8wkNQTO8pSTQDZuoyFch';
  const consumerSecret = 'hhxATh07ZNbRtGfubtJ9NUNuHoxuzrfAG5ENdPqJ4QVYLCHLWWZihsy7Drit8tg1';
  const BusinessShortCode = '174379';
  const Passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';

  // Prepare password
  const Password = Buffer.from(BusinessShortCode + Passkey + formattedTimestamp).toString('base64');

  // Callback URL – must be publicly accessible
  const CallBackURL = 'https://teremiweb.netlify.app/.netlify/functions/callback';

  // Generate access token
  const auth = Buffer.from(consumerKey + ':' + consumerSecret).toString('base64');
  const tokenUrl = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

  let accessToken;
  try {
    const tokenRes = await fetch(tokenUrl, {
      headers: {
        Authorization: 'Basic ' + auth,
      },
    });
    if (!tokenRes.ok) {
      return {
        statusCode: tokenRes.status,
        body: JSON.stringify({ error: 'Failed to get access token' }),
      };
    }
    const tokenData = await tokenRes.json();
    accessToken = tokenData.access_token;
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Access token request failed: ' + err.message }),
    };
  }

  // Prepare STK push payload
  const stkUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
  const stkPayload = {
    BusinessShortCode,
    Password,
    Timestamp: formattedTimestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA,
    PartyB: BusinessShortCode,
    PhoneNumber: PartyA,
    CallBackURL,
    AccountReference: 'PAY-' + Date.now(),
    TransactionDesc: 'Payment for services',
  };

  // Send STK push
  try {
    const stkRes = await fetch(stkUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken,
      },
      body: JSON.stringify(stkPayload),
    });

    const stkData = await stkRes.json();

    if (!stkRes.ok) {
      return {
        statusCode: stkRes.status,
        body: JSON.stringify({
          error: 'Failed to initiate STK Push',
          response: stkData,
        }),
      };
    }

    // Success
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        response: stkData,
        request: {
          phone: PartyA,
          amount,
          reference: stkPayload.AccountReference,
        },
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'STK Push request failed: ' + err.message }),
    };
  }
};
