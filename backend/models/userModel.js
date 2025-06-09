const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  business_name: { type: String },
  registration_number: { type: String },
  contact_number: { type: String },
  role: { type: String, enum: ['consumer', 'manufacturer'], default: 'manufacturer' }, 
  
  isVerified: {
    type: Boolean,
    default: false, 
  },
  verificationToken: String,
  verificationTokenExpires: Date, 

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