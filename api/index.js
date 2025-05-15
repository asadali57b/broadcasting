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
const express = require('express');
const serverless = require('serverless-http');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// ✅ DB Connection outside the handler
mongoose.connect("mongodb+srv://broadcastUser:asad2617146@cluster0.adoaooh.mongodb.net/broadcasting?retryWrites=true&w=majority&appName=Cluster0", {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const broadcasting_routes = require('../routes/broadcasting_routes');
app.use('/api', broadcasting_routes);

// ✅ Export serverless function
module.exports = serverless(app);
