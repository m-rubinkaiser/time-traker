const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    console.log('✅ MongoDB using cached connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('⏳ Connecting to MongoDB...');
    cached.promise = mongoose.connect(process.env.MONGO_URI).then((mongoose) => {
      console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error(`❌ MongoDB Error: ${e.message}`);
    throw e;
  }

  return cached.conn;
};

module.exports = connectDB;
