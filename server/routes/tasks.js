const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Room = require('../models/Room');
const isAuthenticated = require('../middleware/isAuthenticated');

// GET all tasks for a room
router.get('/room/:roomId', isAuthenticated, async (req, res) => {
  try {
    const tasks = await Task.find({ room: req.params.roomId })
      .populate('assignedTo', 'name avatar')
      .populate('createdBy', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET tasks by status
router.get('/room/:roomId/status/:status', isAuthenticated, async (req, res) => {
  try {
    const tasks = await Task.find({
      room: req.params.roomId,
      status: req.params.status
    }).populate('assignedTo', 'name avatar')
      .populate('createdBy', 'name avatar')
      .sort({ deadline: 1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET overdue tasks
router.get('/room/:roomId/overdue', isAuthenticated, async (req, res) => {
  try {
    const tasks = await Task.find({
      room: req.params.roomId,
      deadline: { $lt: new Date() },
      status: { $ne: 'completed' }
    }).populate('assignedTo', 'name avatar')
      .populate('createdBy', 'name avatar');

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET tasks assigned to a specific user
router.get('/room/:roomId/user/:userId', isAuthenticated, async (req, res) => {
  try {
    const tasks = await Task.find({
      room: req.params.roomId,
      assignedTo: req.params.userId
    }).populate('assignedTo', 'name avatar')
      .populate('createdBy', 'name avatar')
      .sort({ deadline: 1 });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create task
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const task = await Task.create({
      title: req.body.title,
      description: req.body.description || '',
      room: req.body.roomId,
      assignedTo: req.body.assignedTo || null,
      createdBy: req.user._id,
      status: 'pending',
      priority: req.body.priority || 'medium',
      deadline: req.body.deadline || null
    });

    const populated = await task
      .populate('assignedTo', 'name avatar')

    const final = await populated
      .populate('createdBy', 'name avatar');

    res.status(201).json({ task: final });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update task
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description,
        assignedTo: req.body.assignedTo,
        status: req.body.status,
        priority: req.body.priority,
        deadline: req.body.deadline
      },
      { new: true }
    ).populate('assignedTo', 'name avatar')
     .populate('createdBy', 'name avatar');

    if (!task) return res.status(404).json({ error: 'Task not found' });

    res.json({ task });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE task
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;