const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/alerts', require('./routes/alertRoutes'));


// Routes
app.use('/api/hotspots', require('./routes/hotspotRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/cooling-centers', require('./routes/coolingCenterRoutes'));

app.get('/', (req, res) => {
  res.send('Chhaya Backend is Running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
