const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const { PrivyClient } = require('@privy-io/server-auth');

// Privy JWKS endpoint for token verification (Privy uses ES256)
const PRIVY_APP_ID = process.env.PRIVY_APP_ID;
const PRIVY_JWKS_URL = process.env.PRIVY_JWKS_URL;
const PRIVY_ISSUER = process.env.PRIVY_ISSUER || 'privy.io';

// Create JWKS client with caching (24-hour cache for performance)
const client = PRIVY_JWKS_URL
  ? jwksClient({
      jwksUri: PRIVY_JWKS_URL,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 86400000, // 24 hours in milliseconds
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    })
  : null;

/**
 * Retrieves the signing key from Privy JWKS endpoint.
 * @param {string} kid - Key ID from token header
 * @returns {Promise<string>} - Public key for verification
 */
const getSigningKey = (kid) => {
  return new Promise((resolve, reject) => {
    if (!client) {
      reject(new Error('JWKS client not configured'));
      return;
    }
    client.getSigningKey(kid, (err, key) => {
      if (err) {
        reject(err);
        return;
      }
      const signingKey = key.getPublicKey();
      resolve(signingKey);
    });
  });
};

/**
 * Verifies a JWT token using Privy JWKS.
 * This properly validates the ES256/RS256 signature, unlike jwt.decode().
 *
 * @param {string} token - JWT token to verify
 * @returns {Promise<object>} - Decoded and verified token payload
 */
const verifyJWTWithJWKS = async (token) => {
  // First decode the header to get the key ID (kid)
  const decoded = jwt.decode(token, { complete: true });

  if (!decoded || !decoded.header) {
    throw new Error('Invalid token format');
  }

  const kid = decoded.header.kid;
  if (!kid) {
    throw new Error('Token header missing key ID (kid)');
  }

  // Get the public key from JWKS
  const signingKey = await getSigningKey(kid);

  // Verify the token with the public key
  // Privy uses ES256 algorithm for access tokens
  const verified = jwt.verify(token, signingKey, {
    algorithms: ['ES256', 'RS256'],
    issuer: PRIVY_ISSUER,
    audience: PRIVY_APP_ID,
    clockTolerance: 30, // 30 seconds tolerance for clock skew
  });

  return verified;
};

const verifyToken = async (req, res, next) => {
  // 1. Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <TOKEN>"

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  // Check if Privy environment is configured
  if (!PRIVY_APP_ID || !PRIVY_JWKS_URL) {
    console.error('PRIVY_APP_ID or PRIVY_JWKS_URL not configured - cannot verify tokens');
    return res.status(500).json({
      success: false,
      message: 'Authentication misconfigured'
    });
  }

  try {
    // Debug: decode token to see actual issuer (without verification)
    const decoded = jwt.decode(token);
    if (decoded && decoded.iss) {
      console.log('JWT actual issuer:', decoded.iss);
      console.log('JWT expected issuer:', PRIVY_ISSUER);
    }

    // 2. Verify the token with JWKS (proper RS256 signature verification)
    const verified = await verifyJWTWithJWKS(token);

    // 3. Validate required claims
    if (!verified.sub && !verified.userId && !verified.id) {
      console.warn('Token verified but missing user identifier');
    }

    // 4. Check token expiration (jwt.verify handles this, but double-check)
    if (verified.exp && Date.now() >= verified.exp * 1000) {
      return res.status(403).json({
        success: false,
        message: 'Token has expired.'
      });
    }

    // 5. Attach user info to request
    req.user = verified;

    // 6. Proceed to the route
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);

    // Provide specific error messages for common issues
    let message = 'Invalid token.';
    if (error.name === 'TokenExpiredError') {
      message = 'Token has expired.';
    } else if (error.name === 'JsonWebTokenError') {
      message = 'Token signature verification failed.';
    } else if (error.message.includes('Unable to find')) {
      message = 'Token signing key not found.';
    }

    res.status(403).json({
      success: false,
      message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Optional authentication middleware - allows requests with or without tokens
// Used for endpoints that should work for both authenticated and anonymous users
const optionalAuth = async (req, res, next) => {
  // 1. Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <TOKEN>"

  // If no token, proceed without authentication
  if (!token) {
    req.user = null;
    return next();
  }

  // Check if Privy environment is configured
  if (!PRIVY_APP_ID || !PRIVY_JWKS_URL) {
    console.error('PRIVY_APP_ID or PRIVY_JWKS_URL not configured - cannot verify tokens');
    req.user = null;
    return next();
  }

  try {
    // 2. Verify the token with JWKS
    const verified = await verifyJWTWithJWKS(token);

    // 3. Attach user info to request if token is valid
    req.user = verified;

    // 4. Proceed to the route
    next();
  } catch (error) {
    // Log the error but don't reject the request
    console.warn('Token verification failed (non-fatal):', error.message);
    req.user = null;
    next();
  }
};

// Privy server client for looking up user details (email) by DID
const PRIVY_APP_SECRET = process.env.PRIVY_APP_SECRET;
const privyClient = (PRIVY_APP_ID && PRIVY_APP_SECRET)
  ? new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET)
  : null;

// Admin verification middleware - checks if user's email is in ADMIN_EMAILS env var
// Must be used AFTER verifyToken middleware
const verifyAdmin = async (req, res, next) => {
  const adminEmails = process.env.ADMIN_EMAILS;

  if (!adminEmails) {
    console.error('ADMIN_EMAILS environment variable is not set');
    return res.status(500).json({
      success: false,
      message: 'Admin access not configured'
    });
  }

  if (!privyClient) {
    console.error('PRIVY_APP_SECRET not configured - cannot look up user email');
    return res.status(500).json({
      success: false,
      message: 'Admin verification misconfigured'
    });
  }

  const adminList = adminEmails.split(',').map(email => email.trim().toLowerCase());
  const privyDid = req.user?.sub;

  if (!privyDid) {
    return res.status(403).json({
      success: false,
      message: 'Unable to determine user identity from token'
    });
  }

  try {
    const privyUser = await privyClient.getUser(privyDid);
    const userEmail = privyUser?.email?.address?.toLowerCase();

    if (!userEmail) {
      return res.status(403).json({
        success: false,
        message: 'No email associated with this account'
      });
    }

    if (!adminList.includes(userEmail)) {
      console.warn(`Admin access denied for email: ${userEmail}`);
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    req.isAdmin = true;
    req.adminEmail = userEmail;
    next();
  } catch (error) {
    console.error('Failed to look up user from Privy:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify admin status'
    });
  }
};

module.exports = { verifyToken, optionalAuth, verifyAdmin };
