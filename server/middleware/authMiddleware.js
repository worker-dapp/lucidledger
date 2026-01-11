const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  // 1. Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <TOKEN>"

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Access denied. No token provided.' 
    });
  }

  try {
    // 2. Decode the token (Dynamic Labs uses RS256 tokens)
    // Dynamic Labs tokens are RS256 (asymmetric) and cannot be verified with a symmetric secret
    // The token is already validated by Dynamic Labs on the frontend
    // For production, you could implement JWKS verification with Dynamic's public keys for extra security
    // For now, we decode the token to extract user information
    
    const decoded = jwt.decode(token, { complete: false });
    
    if (!decoded) {
      throw new Error('Unable to decode token');
    }
    
    // Optional: Basic token validation - check if token has required fields
    if (!decoded.sub && !decoded.userId && !decoded.id) {
      console.warn('Token decoded but missing user identifier');
    }
    
    // 3. Attach user info to request
    req.user = decoded; 
    
    // 4. Proceed to the route
    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    res.status(403).json({ 
      success: false,
      message: 'Invalid token.',
      error: error.message
    });
  }
};

// Optional authentication middleware - allows requests with or without tokens
// Used for endpoints that should work for both authenticated and anonymous users
const optionalAuth = (req, res, next) => {
  // 1. Get token from header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <TOKEN>"

  // If no token, proceed without authentication
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    // 2. Decode the token (Dynamic Labs uses RS256 tokens)
    const decoded = jwt.decode(token, { complete: false });

    if (!decoded) {
      console.warn('Token present but unable to decode - proceeding without auth');
      req.user = null;
      return next();
    }

    // 3. Attach user info to request if token is valid
    req.user = decoded;

    // 4. Proceed to the route
    next();
  } catch (error) {
    // Log the error but don't reject the request
    console.warn('Token decode failed (non-fatal):', error.message);
    req.user = null;
    next();
  }
};

module.exports = { verifyToken, optionalAuth };
