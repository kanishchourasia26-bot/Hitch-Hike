const axios = require('axios');
const qs = require('qs');

// DigiLocker API Configuration
const DIGILOCKER_CONFIG = {
  baseURL: process.env.DIGILOCKER_BASE_URL || 'https://api.digitallocker.gov.in', // Use sandbox URL for testing
  clientId: process.env.DIGILOCKER_CLIENT_ID,
  clientSecret: process.env.DIGILOCKER_CLIENT_SECRET,
  redirectUri: process.env.DIGILOCKER_REDIRECT_URI || 'http://localhost:5000/api/users/digilocker/callback',
};

/**
 * Step 1: Generate DigiLocker authorization URL
 * User will be redirected to this URL to login and give consent
 */
const getAuthorizationURL = (userId) => {
  const params = {
    response_type: 'code',
    client_id: DIGILOCKER_CONFIG.clientId,
    redirect_uri: DIGILOCKER_CONFIG.redirectUri,
    state: userId, // Pass userId as state to identify user after callback
    // Request specific documents
    scope: 'aadhaar pan dl', // Request Aadhaar, PAN, and Driving License
  };

  const queryString = qs.stringify(params);
  return `${DIGILOCKER_CONFIG.baseURL}/public/oauth2/1/authorize?${queryString}`;
};

/**
 * Step 2: Exchange authorization code for access token
 * Called after user completes DigiLocker consent
 */
const getAccessToken = async (authorizationCode) => {
  try {
    const response = await axios.post(
      `${DIGILOCKER_CONFIG.baseURL}/public/oauth2/1/token`,
      qs.stringify({
        code: authorizationCode,
        grant_type: 'authorization_code',
        client_id: DIGILOCKER_CONFIG.clientId,
        client_secret: DIGILOCKER_CONFIG.clientSecret,
        redirect_uri: DIGILOCKER_CONFIG.redirectUri,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return response.data; // { access_token, token_type, expires_in }
  } catch (error) {
    console.error('DigiLocker token error:', error.response?.data || error.message);
    throw new Error('Failed to get DigiLocker access token');
  }
};

/**
 * Step 3: Fetch user's Aadhaar details
 */
const getAadhaarDetails = async (accessToken) => {
  try {
    const response = await axios.get(
      `${DIGILOCKER_CONFIG.baseURL}/public/oauth2/2/xml/aadhaar`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Parse XML response (you'll get name, DOB, gender, photo, address)
    return response.data;
  } catch (error) {
    console.error('DigiLocker Aadhaar fetch error:', error.response?.data || error.message);
    throw new Error('Failed to fetch Aadhaar details');
  }
};

/**
 * Step 4: Fetch Driving License details
 */
const getDrivingLicenseDetails = async (accessToken) => {
  try {
    const response = await axios.get(
      `${DIGILOCKER_CONFIG.baseURL}/public/oauth2/2/xml/driving_license`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('DigiLocker DL fetch error:', error.response?.data || error.message);
    throw new Error('Failed to fetch Driving License details');
  }
};

/**
 * Step 5: Fetch PAN details
 */
const getPANDetails = async (accessToken) => {
  try {
    const response = await axios.get(
      `${DIGILOCKER_CONFIG.baseURL}/public/oauth2/2/xml/pan`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('DigiLocker PAN fetch error:', error.response?.data || error.message);
    throw new Error('Failed to fetch PAN details');
  }
};

/**
 * Helper: Parse XML to JSON (DigiLocker returns XML)
 */
const parseXMLtoJSON = (xmlString) => {
  // You'll need to use a library like 'xml2js' to parse
  // npm install xml2js
  const xml2js = require('xml2js');
  
  return new Promise((resolve, reject) => {
    xml2js.parseString(xmlString, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};

module.exports = {
  getAuthorizationURL,
  getAccessToken,
  getAadhaarDetails,
  getDrivingLicenseDetails,
  getPANDetails,
  parseXMLtoJSON,
};
