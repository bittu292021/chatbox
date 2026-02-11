const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ username, email, password });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { 
      expiresIn: '7d' 
    });

    console.log('🎉 Register SUCCESS:', username);

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email 
      } 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(400).json({ message: error.message });
  }
});

// Login 
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt:', email);
    
    // ✅ FIXED: Load password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    console.log('✅ User found, password exists:', !!user.password);
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { 
      expiresIn: '7d' 
    });

    console.log('🎉 Login SUCCESS:', user.username);

    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username, 
        email: user.email 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ message: 'Login failed' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

// Get all users (except current user) ✅ USERS LIST ROUTE
router.get('/users', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log(`📋 Fetching users for userId: ${decoded.userId}`);
    
    const users = await User.find({ 
      _id: { $ne: decoded.userId } 
    }).select('username email isOnline avatar');
    
    console.log(`📋 Found ${users.length} users for ${decoded.userId}`);
    res.json(users);
  } catch (error) {
    console.error('❌ Users route error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current user profile ✅ PROFILE ROUTE
router.get('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('❌ Profile error:', error.message);
    res.status(401).json({ message: 'Unauthorized' });
  }
});

module.exports = router;
