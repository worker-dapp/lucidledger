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
    // 2. Verify the token
    // Note: For production with Dynamic, you should verify against their public key (JWKS).
    // For now, we are using the local secret or assuming the token structure is valid if we can decode it.
    // If you have the Dynamic public key, replace process.env.JWT_SECRET with it.
    // If using Dynamic's developer JWTs for testing, the secret might work if configured.
    
    // WARNING: If these are real Dynamic tokens (RS256), verify() with a symmetric secret will fail.
    // If we don't have the public key yet, we might need to skip signature verification 
    // or ask the user for the public key.
    // For this step, I will implement standard verification.
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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
