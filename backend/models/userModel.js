const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    business_name: { type: String },  // Only for manufacturers
    registration_number: { type: String },  // Only for manufacturers
    contact_number: { type: String },  // Only for manufacturers
    reports: [
      {
        product: { 
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product' 
        },
        detectedAt: Date,
        scanCount: Number,
        locations: [String]
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);