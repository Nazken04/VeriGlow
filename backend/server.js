const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
// const bodyParser = require('body-parser'); // <-- REMOVE THIS LINE
const cors = require('cors');

dotenv.config();

const app = express();

// 1. Place body parsing middleware first, using express.json()
app.use(express.json()); // This replaces bodyParser.json()
// app.use(bodyParser.json()); // REMOVE THIS LINE

// Define allowed origins with your NEW Vercel URL
const allowedOrigins = [
  'https://veriglow-r-2tt3.vercel.app', // <-- CRITICAL: UPDATE THIS TO YOUR CURRENT VERGEL URL
  // Add any other specific origins if needed, e.g., another testing domain
];

// Configure and apply CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    // and requests from explicitly allowed origins
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