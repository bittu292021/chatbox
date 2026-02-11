const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage
} = require('../controllers/messageController');

router.post('/send', auth, sendMessage);
router.get('/:chatId/messages', auth, getMessages);
router.put('/:messageId/read', auth, markAsRead);
router.delete('/:messageId', auth, deleteMessage);

module.exports = router;