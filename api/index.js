// const express = require('express');
// require('dotenv').config();
// const app = express();
// require('./database');

// // ✅ Correct order: Body parsers first
// app.use(express.json()); // Parse JSON requests
// app.use(express.urlencoded({ extended: true })); // Parse form data

// // Routes
// app.get('/', (req, res) => {
//   res.send('API is running');
// });

// const broadcasting_routes = require('./routes/broadcasting_routes');
// app.use('/api/broadcasting', broadcasting_routes);

// module.exports = app;
// api/index.js
// api/index.js






// const express = require('express');
// require('dotenv').config();
// require('../database');
// const broadcastingRoutes = require('../routes/broadcasting_routes');

// const app = express();

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));


// app.use('/api/broadcasting', broadcastingRoutes);

// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require('express');
require('dotenv').config();
const mongoose = require('mongoose');  // Move mongoose to top
const broadcastingRoutes = require('../routes/broadcasting_routes');
const http = require('http');
const cors = require('cors');
const setupSocket = require('../socket');
const app = express();

// Database connection - Move this to separate database.js file
mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,  // Keep trying for 5 seconds
  socketTimeoutMS: 45000,          // Close sockets after 45s inactivity
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

const server = http.createServer(app);

// Setup Socket.io
const io = setupSocket(server);

// Make io accessible to our routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/broadcasting', broadcastingRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});