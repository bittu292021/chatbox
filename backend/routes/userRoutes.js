const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAllUsers,
  getUserById,
  searchUsers,
  updateProfile,
  getFriends
} = require('../controllers/userController');

router.get('/', auth, getAllUsers);
router.get('/search', auth, searchUsers);
router.get('/friends', auth, getFriends);
router.get('/:id', auth, getUserById);
router.put('/profile', auth, updateProfile);

module.exports = router;