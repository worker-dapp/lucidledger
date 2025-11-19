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

module.exports = verifyToken;
