require('dotenv').config();
console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ FOUND' : '❌ MISSING');
console.log('Full URI starts with:', process.env.MONGO_URI?.substring(0, 20));
