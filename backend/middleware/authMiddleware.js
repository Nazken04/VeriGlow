const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    console.log('No token provided');  
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const { userId } = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded userId:', userId); 
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found');  
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;  
    next();
  } catch (err) {
    console.error('Error verifying token:', err);  
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
