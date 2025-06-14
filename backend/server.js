const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

dotenv.config();

const app = express();

app.use(express.json()); 
const allowedOrigins = [
  'http://localhost:3000', // For local frontend development
  'http://localhost:5173', 
  'https://veriglow-r-2tt3.vercel.app', 
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) { // Use .includes() for better readability
      callback(null, true); // Allow the request
    } else {
      // Deny others and log which origin was denied
      console.log(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true, // Important if your frontend sends cookies or Authorization headers
  optionsSuccessStatus: 200 // For preflight requests, a 200 status is typically used (default is 204)
}));


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes - these should always come after middleware
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));