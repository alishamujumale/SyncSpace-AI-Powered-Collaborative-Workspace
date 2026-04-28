module.exports = (io) => {
  io.on('connection', (socket) => {

    // User joins a room's task board
    socket.on('join-taskboard', ({ roomId }) => {
      socket.join(`tasks-${roomId}`);
    });

    // New task created
    socket.on('task-created', ({ roomId, task }) => {
      // Broadcast to everyone else in room
      socket.to(`tasks-${roomId}`).emit('task-added', task);
    });

    // Task updated (status, assignment, etc)
    socket.on('task-updated', ({ roomId, task }) => {
      socket.to(`tasks-${roomId}`).emit('task-changed', task);
    });

    // Task deleted
    socket.on('task-deleted', ({ roomId, taskId }) => {
      socket.to(`tasks-${roomId}`).emit('task-removed', taskId);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected from taskboard:', socket.id);
    });
  });
};