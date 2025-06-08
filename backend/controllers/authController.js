const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // For generating random tokens
const User = require('../models/userModel');
const sendEmail = require('../utils/sendEmail'); // Make sure this path is correct

// Register a new user
exports.register = async (req, res) => {
  const { email, password, name, business_name, registration_number, contact_number } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      // If user exists but is not verified, you could resend the email here.
      // For simplicity, we just say user exists.
      return res.status(400).json({ message: 'User already exists with this email address.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    // Token valid for 24 hours (3600000 ms * 24 hours)
    const verificationTokenExpires = Date.now() + (3600000 * 24); 

    const newUser = new User({
      email,
      password: hashedPassword,
      name,
      business_name,
      registration_number,
      contact_number,
      isVerified: false, // User is NOT verified upon initial registration
      verificationToken,
      verificationTokenExpires,
    });

    await newUser.save();

    // Construct verification URL
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    const message = `
      <h1>Welcome to VeriGlow!</h1>
      <p>Thank you for registering. Please verify your email by clicking on the link below:</p>
      <a href="${verificationUrl}" clicktracking="off">${verificationUrl}</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not register for VeriGlow, please ignore this email.</p>
    `;

    try {
      await sendEmail({
        email: newUser.email,
        subject: 'VeriGlow Account Verification',
        message,
      });
      res.status(201).json({ 
        message: 'Registration successful! Please check your email to verify your account.' 
      });
    } catch (emailErr) {
      console.error("Email sending failed:", emailErr);
      // If email sending fails, you might want to log this but still indicate
      // that registration data was saved. User will need to resend.
      res.status(500).json({ 
        message: 'Registration successful, but failed to send verification email. Please try to resend the email later.' 
      });
    }

  } catch (err) {
    console.error("Registration Error:", err); 
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// Login user and generate JWT token
exports.login = async (req, res) => {
  const { email, password } = req.body;

  console.log(`[AUTH] Attempting login for email: ${email}`); // NEW LOG

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[AUTH] Login failed: User not found for email: ${email}`); // NEW LOG
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log(`[AUTH] User found: ${user.email}, isVerified: ${user.isVerified}`); // NEW LOG

    // --- CRUCIAL: CHECK IF USER IS VERIFIED ---
    if (!user.isVerified) {
      console.log(`[AUTH] Login denied: Email not verified for user: ${user.email}`); // NEW LOG
      return res.status(403).json({ 
        message: 'Please verify your email address before logging in. Check your inbox for a verification link.',
        requiresVerification: true // Frontend can use this flag
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log(`[AUTH] Login failed: Invalid password for user: ${user.email}`); // NEW LOG
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log(`[AUTH] Login successful for user: ${user.email}`); // NEW LOG
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role, isVerified: user.isVerified } }); 
  } catch (err) {
    console.error(`[AUTH] Server error during login for email ${email}:`, err); // NEW LOG
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// Verify Email Endpoint (User clicks link in email)
exports.verifyEmail = async (req, res) => {
  const { token } = req.params;

  console.log(`[AUTH] Attempting email verification for token: ${token}`); // NEW LOG

  try {
    const user = await User.findOne({ 
      verificationToken: token,
      verificationTokenExpires: { $gt: Date.now() } 
    });

    if (!user) {
      console.log(`[AUTH] Verification failed: Invalid or expired token ${token}`); // NEW LOG
      return res.status(400).json({ message: 'Invalid or expired verification token.' });
    }

    console.log(`[AUTH] User found for verification: ${user.email}. Setting isVerified to true.`); // NEW LOG
    user.isVerified = true; 
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();
    console.log(`[AUTH] User ${user.email} successfully verified and saved to DB.`); // NEW LOG

    res.status(200).json({ message: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    console.error(`[AUTH] Server error during email verification for token ${token}:`, err); // NEW LOG
    res.status(500).json({ message: 'Server error during email verification.' });
  }
};

// Resend Verification Email Endpoint
exports.resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found with this email.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Your email is already verified. Please log in.' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = Date.now() + (3600000 * 24); // New token expires in 24 hours

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    // Send new verification email
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    const message = `
      <h1>VeriGlow Account Verification (Resent)</h1>
      <p>You recently requested a new verification link. Please verify your email by clicking on the link below:</p>
      <a href="${verificationUrl}" clicktracking="off">${verificationUrl}</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    await sendEmail({
      email: user.email,
      subject: 'VeriGlow Account Verification (Resent)',
      message,
    });

    res.status(200).json({ message: 'New verification email sent! Please check your inbox.' });

  } catch (err) {
    console.error("Resend Verification Email Error:", err);
    res.status(500).json({ message: 'Server error during resending verification email.' });
  }
};

// User profile (ensure it returns isVerified status)
exports.profile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -verificationToken -verificationTokenExpires') // Do not send sensitive/internal fields
      .populate({
        path: 'reports.product',
        select: 'product_name batch_number qr_code'
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      name: user.name,
      email: user.email,
      business_name: user.business_name,
      registration_number: user.registration_number,
      contact_number: user.contact_number,
      isVerified: user.isVerified, // Include verification status in profile
      reports: user.reports
    });
  } catch (err) {
    console.error('Server error:', err);  
    res.status(500).json({ message: 'Server error' });
  }
};