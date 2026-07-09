const mongoose = require('mongoose');
const dns = require('dns');

// Configure custom DNS servers to bypass potential local DNS resolution failures (e.g., querySrv ECONNREFUSED on Windows/IPv6)
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  console.warn('⚠️ MongoDB DNS: Failed to set custom DNS servers, using system defaults:', err.message);
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

