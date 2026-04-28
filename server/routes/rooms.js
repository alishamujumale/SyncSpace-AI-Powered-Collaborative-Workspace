const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const isAuthenticated = require('../middleware/isAuthenticated');
const { v4: uuidv4 } = require('uuid');

// GET all rooms for logged in user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { leader: req.user._id },
        { members: req.user._id }
      ]
    }).populate('leader', 'name avatar')
      .populate('members', 'name avatar')
      .sort({ updatedAt: -1 });

    res.json({ rooms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single room
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('leader', 'name avatar')
      .populate('members', 'name avatar');

    if (!room) return res.status(404).json({ error: 'Room not found' });

    const isMember = room.leader._id.equals(req.user._id) ||
      room.members.some(m => m._id.equals(req.user._id));

    if (!isMember) return res.status(403).json({ error: 'Access denied' });

    res.json({ room });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create room
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const room = await Room.create({
      name: req.body.name,
      description: req.body.description || '',
      leader: req.user._id,
      members: [req.user._id],
      inviteCode: uuidv4().slice(0, 8).toUpperCase()
    });

    const populated = await room.populate('leader', 'name avatar');
    res.status(201).json({ room: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST join room via invite code
router.post('/join', isAuthenticated, async (req, res) => {
  try {
    const room = await Room.findOne({ inviteCode: req.body.inviteCode });

    if (!room) return res.status(404).json({ error: 'Invalid invite code' });

    const alreadyMember = room.members.some(m => m.equals(req.user._id));
    if (alreadyMember) return res.status(400).json({ error: 'Already a member' });

    room.members.push(req.user._id);
    await room.save();

    res.json({ room });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE room (leader only)
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (!room.leader.equals(req.user._id)) {
      return res.status(403).json({ error: 'Only the leader can delete this room' });
    }

    await room.deleteOne();
    res.json({ message: 'Room deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;