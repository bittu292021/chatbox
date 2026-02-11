const Message = require('../models/Message');
const Chat = require('../models/Chat');
const User = require('../models/User');

const userSocketMap = new Map();

const handleSocketEvents = (socket, io) => {
  socket.on('user_join', async (userId) => {
    userSocketMap.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit('user_online', userId);
    console.log(`User ${userId} online`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { senderId, receiverId, text } = data;
      const chatId = `${senderId}-${receiverId}`;

      const message = new Message({
        chatId,
        senderId,
        receiverId,
        text
      });
      await message.save();

      const receiverSocketId = userSocketMap.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', message);
      }

      socket.emit('message_sent', message);
    } catch (error) {
      console.error('Message error:', error);
    }
  });

  socket.on('typing', (data) => {
    const { receiverId } = data;
    const receiverSocketId = userSocketMap.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing');
    }
  });

  socket.on('stop_typing', (receiverId) => {
    const receiverSocketId = userSocketMap.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_stop_typing');
    }
  });

  socket.on('disconnect', async () => {
    for (let [userId, socketId] of userSocketMap) {
      if (socketId === socket.id) {
        userSocketMap.delete(userId);
        await User.findByIdAndUpdate(userId, { isOnline: false });
        io.emit('user_offline', userId);
        break;
      }
    }
  });
};

module.exports = { handleSocketEvents };
