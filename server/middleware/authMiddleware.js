const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Dynamic Labs JWKS endpoint for RS256 token verification
const DYNAMIC_LABS_ENV_ID = process.env.DYNAMIC_LABS_ENVIRONMENT_ID;
const JWKS_URI = `https://app.dynamic.xyz/api/v0/sdk/${DYNAMIC_LABS_ENV_ID}/.well-known/jwks`;

// Create JWKS client with caching (24-hour cache for performance)
const client = jwksClient({
  jwksUri: JWKS_URI,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 86400000, // 24 hours in milliseconds
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

/**
 * Retrieves the signing key from Dynamic Labs JWKS endpoint.
 * @param {string} kid - Key ID from token header
 * @returns {Promise<string>} - Public key for verification
 */
const getSigningKey = (kid) => {
  return new Promise((resolve, reject) => {
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
 * Verifies a JWT token using Dynamic Labs JWKS.
 * This properly validates the RS256 signature, unlike jwt.decode().
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
  const verified = jwt.verify(token, signingKey, {
    algorithms: ['RS256'],
    // Dynamic Labs tokens have these standard claims
    issuer: `app.dynamicauth.com/${DYNAMIC_LABS_ENV_ID}`,
    // Don't verify audience in case it varies
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

  // Check if DYNAMIC_LABS_ENVIRONMENT_ID is configured
  if (!DYNAMIC_LABS_ENV_ID) {
    console.error('DYNAMIC_LABS_ENVIRONMENT_ID not configured - cannot verify tokens');
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
      console.log('JWT expected issuer:', `https://app.dynamic.xyz/${DYNAMIC_LABS_ENV_ID}`);
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

  // Check if DYNAMIC_LABS_ENVIRONMENT_ID is configured
  if (!DYNAMIC_LABS_ENV_ID) {
    console.error('DYNAMIC_LABS_ENVIRONMENT_ID not configured - cannot verify tokens');
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

// Admin verification middleware - checks if user's email is in ADMIN_EMAILS env var
// Must be used AFTER verifyToken middleware
const verifyAdmin = (req, res, next) => {
  const adminEmails = process.env.ADMIN_EMAILS;

  if (!adminEmails) {
    console.error('ADMIN_EMAILS environment variable is not set');
    return res.status(500).json({
      success: false,
      message: 'Admin access not configured'
    });
  }

  // Parse comma-separated admin emails and normalize
  const adminList = adminEmails.split(',').map(email => email.trim().toLowerCase());

  // Get email from the decoded token (Dynamic Labs stores it in various places)
  const userEmail = req.user?.email ||
                    req.user?.verified_credentials?.[0]?.email ||
                    req.user?.verifiedCredentials?.[0]?.email;

  if (!userEmail) {
    return res.status(403).json({
      success: false,
      message: 'Unable to determine user email from token'
    });
  }

  const normalizedEmail = userEmail.toLowerCase();

  if (!adminList.includes(normalizedEmail)) {
    console.warn(`Admin access denied for email: ${normalizedEmail}`);
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  // User is an admin, proceed
  req.isAdmin = true;
  next();
};

module.exports = { verifyToken, optionalAuth, verifyAdmin };
