const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const isAuthenticated = require('../middleware/isAuthenticated');

// GET all messages for a room
router.get('/:roomId', isAuthenticated, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 })
      .limit(100); // last 100 messages

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST send message
router.post('/:roomId', isAuthenticated, async (req, res) => {
  try {
    const message = await Message.create({
      room: req.params.roomId,
      sender: req.user._id,
      text: req.body.text,
      isAI: false
    });

    const populated = await message.populate('sender', 'name avatar');
    res.status(201).json({ message: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;