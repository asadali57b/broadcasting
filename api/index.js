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
require('dotenv').config({ path: './.env' });
require('../database'); // adjust path if needed

const app = express();
const serverless = require('serverless-http');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const broadcasting_routes = require('../routes/broadcasting_routes');
app.use('/api/broadcasting', broadcasting_routes);

module.exports = serverless(app);
