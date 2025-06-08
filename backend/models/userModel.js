const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  business_name: { type: String },
  registration_number: { type: String },
  contact_number: { type: String },
  role: { type: String, enum: ['consumer', 'manufacturer'], default: 'manufacturer' }, 
  
  // --- NEW FIELDS FOR EMAIL VERIFICATION ---
  isVerified: {
    type: Boolean,
    default: false, // User is NOT verified by default
  },
  verificationToken: String,
  verificationTokenExpires: Date, // Date when the token expires
  // ------------------------------------------

  reports: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    date: {
      type: Date,
      default: Date.now
    },
    report_details: String
  }],
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);