const Message = require('../models/Message');

module.exports = (io) => {
  io.on('connection', (socket) => {

    // User joins a room
    socket.on('join-room', ({ roomId, user }) => {
      socket.join(roomId);
      // Notify others someone joined
      socket.to(roomId).emit('user-joined', {
        name: user.name,
        avatar: user.avatar
      });
    });

    // User sends a chat message
    socket.on('send-message', async ({ roomId, text, sender }) => {
      try {
        const message = await Message.create({
          room: roomId,
          sender: sender._id,
          text,
          isAI: false
        });

        // Broadcast to everyone in room including sender
        io.to(roomId).emit('receive-message', {
          _id: message._id,
          text,
          sender,
          createdAt: message.createdAt
        });
      } catch (error) {
        console.error('Message save failed:', error.message);
      }
    });

    // User is typing
    socket.on('typing', ({ roomId, user }) => {
      socket.to(roomId).emit('user-typing', { name: user.name });
    });

    // User stopped typing
    socket.on('stop-typing', ({ roomId }) => {
      socket.to(roomId).emit('user-stopped-typing');
    });

    socket.on('disconnect', () => {
      console.log('User disconnected from chat:', socket.id);
    });
  });
};