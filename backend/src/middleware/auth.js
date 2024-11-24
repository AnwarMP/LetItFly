const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// In auth.js middleware
  const checkRole = (roles) => {
    return (req, res, next) => {
        console.log('Checking role:', {
            userRole: req.user?.role,
            requiredRoles: roles
        });
        
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Forbidden - Insufficient role',
                userRole: req.user.role,
                requiredRoles: roles
            });
        }

        next();
    };
  };

module.exports = {
  authenticateToken,
  checkRole
};