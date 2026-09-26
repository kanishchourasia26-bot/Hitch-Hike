const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');

async function testPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Get user email from command line
    const email = process.argv[2];
    const testPassword = process.argv[3];

    if (!email || !testPassword) {
      console.log('❌ Usage: node test-password.js <email> <password>');
      process.exit(1);
    }

    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    console.log('\n📋 User Details:');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Phone:', user.phone);
    console.log('Password Hash:', user.password);

    // Test password
    console.log('\n🔐 Testing Password...');
    console.log('Testing with:', testPassword);

    const isMatch = await bcrypt.compare(testPassword, user.password);

    if (isMatch) {
      console.log('✅ Password MATCHES! Login should work.');
    } else {
      console.log('❌ Password DOES NOT MATCH! Login will fail.');
      
      // Show what the hash would be for the test password
      const testHash = await bcrypt.hash(testPassword, 10);
      console.log('\n🔍 Debug Info:');
      console.log('Expected hash for test password:', testHash);
      console.log('Stored hash in database:', user.password);
    }

    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    mongoose.connection.close();
  }
}

testPassword();
