const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors')

dotenv.config();

const app = express();
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const corsOptions = {
  origin: 'http://localhost:3000', 
  optionsSuccessStatus: 200 
};
const allowedOrigins = [
  'http://localhost:3000', // For local frontend development
  // Placeholder for your Vercel frontend URL, you'll add this AFTER deploying frontend to Vercel
   'https://veriglow-front-7bw6.vercel.app', // <-- UPDATE THIS LATER
  // ... any other origins for mobile apps, Postman etc.
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true); // Allow requests from allowed origins or no origin (e.g., Postman)
    } else {
      callback(new Error('Not allowed by CORS'), false); // Deny others
    }
  },
  credentials: true, // If your app uses cookies or sends Authorization headers
}));

app.use(express.json()); // T
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

