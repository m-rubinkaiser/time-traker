// Vercel serverless entry point - imports and delegates to Express app
require('dotenv').config({ path: '../.env' });
module.exports = require('../server/server');
