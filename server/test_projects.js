const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

async function test() {
  try {
    await mongoose.connect(MONGO_URI);
    const Project = require('./models/Project');
    const User = require('./models/User');

    const projects = await Project.find({}).populate('createdBy', 'name email');
    projects.forEach(p => {
      console.log(`Project: "${p.name}"`);
      console.log(`  createdBy field: ${JSON.stringify(p.createdBy)}`);
      console.log(`  createdBy.name: ${p.createdBy ? JSON.stringify(p.createdBy.name) : 'N/A'}`);
      console.log(`  createdBy.email: ${p.createdBy ? JSON.stringify(p.createdBy.email) : 'N/A'}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
