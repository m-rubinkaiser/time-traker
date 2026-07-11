require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function testConnection() {
  console.log('Testing connection to:', process.env.MONGO_URI);
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ MongoDB Connected successfully from Local Machine: ${conn.connection.host}`);
    process.exit(0);
  } catch (err) {
    console.error(`❌ MongoDB Connection Error from Local Machine: ${err.message}`);
    process.exit(1);
  }
}

testConnection();
