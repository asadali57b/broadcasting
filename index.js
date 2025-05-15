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
const express = require('express');
require('dotenv').config();
require('../database'); // adjust path if needed

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const broadcasting_routes = require('../routes/broadcasting_routes');
app.use('/api/broadcasting', broadcasting_routes);

// Optional test route
app.get('/', (req, res) => res.send('API is live on Vercel'));

// Export as serverless function
module.exports = app;
module.exports.handler = (req, res) => app(req, res);
