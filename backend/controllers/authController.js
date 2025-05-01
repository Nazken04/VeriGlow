const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Register a new user (consumer or manufacturer)
exports.register = async (req, res) => {
  const { email, password, name, business_name, registration_number, contact_number } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      business_name,
      registration_number,
      contact_number,
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error("Registration Error:", err); 
    res.status(500).json({ message: 'Server error' });
  }
};


// Login user and generate JWT token
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
exports.profile = async (req, res) => {
  try {
    console.log('User ID from middleware:', req.user._id); 
    const user = await User.findById(req.user._id)
      .populate({
        path: 'reports.product',
        select: 'product_name batch_number qr_code'
      });

    if (!user) {
      console.log('User not found');  
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      name: user.name,
      email: user.email,
      business_name: user.business_name,
      registration_number: user.registration_number,
      contact_number: user.contact_number,
      reports: user.reports
    });
  } catch (err) {
    console.error('Server error:', err);  
    res.status(500).json({ message: 'Server error' });
  }
};
