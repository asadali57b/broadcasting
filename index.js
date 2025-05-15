const express = require('express');
require('dotenv').config();
const app = express();
require('./database');

// ✅ Correct order: Body parsers first
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse form data

// Routes
app.get('/', (req, res) => {
  res.send('API is running');
});

const broadcasting_routes = require('./routes/broadcasting_routes');
app.use('/api/broadcasting', broadcasting_routes);

module.exports = app;