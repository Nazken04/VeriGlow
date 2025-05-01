const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    product_name: { type: String, required: true },
    batch_number: { type: String, required: true },
    manufacturing_date: { type: Number, required: true },
    expiry_date: { type: Number, required: true },  
    ingredients: { type: String, required: true },
    image_url: { type: String },
    qr_code: { type: String },
    qr_code_image: { type: String },
    scanHistory: [{ type: Date }],
    scanHistoryLocations: [{ type: String }],
    manufacturer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isCounterfeit: {
      type: Boolean,
      default: false
    },
    counterfeitReports: [{
      detectedAt: Date,
      scanCount: Number,
      locations: [String]
    }],
  },
  { timestamps: true }
);

productSchema.post('find', function(docs) {
  docs.forEach(doc => {
    if (doc.manufacturing_date) {
      doc.manufacturing_date = new Date(doc.manufacturing_date * 1000);
    }
    if (doc.expiry_date) {
      doc.expiry_date = new Date(doc.expiry_date * 1000);
    }
  });
});

module.exports = mongoose.model('Product', productSchema);