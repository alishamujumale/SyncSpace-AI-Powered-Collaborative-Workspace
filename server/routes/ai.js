const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Message = require('../models/Message');
const AISession = require('../models/AISession');
const isAuthenticated = require('../middleware/isAuthenticated');
const { generateProjectPlan, askAssistant, summarizeChat } = require('../services/aiService');

// POST generate full project plan
router.post('/generate-plan', isAuthenticated, async (req, res) => {
  try {
    const { idea, roomId } = req.body;

    const plan = await generateProjectPlan(idea);

    // Auto create tasks in MongoDB
    const createdTasks = [];
    for (const t of plan.tasks) {
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + (t.deadline || 7));

      const task = await Task.create({
        title: t.title,
        description: t.description,
        room: roomId,
        createdBy: req.user._id,
        priority: t.priority || 'medium',
        deadline,
        status: 'pending'
      });
      createdTasks.push(task);
    }

    // Save AI session
    await AISession.create({
      room: roomId,
      prompt: idea,
      response: JSON.stringify(plan),
      tasks: createdTasks.map(t => t._id),
      createdBy: req.user._id
    });

    res.json({ plan, tasks: createdTasks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST ask AI assistant a question
router.post('/ask', isAuthenticated, async (req, res) => {
  try {
    const { question, roomId } = req.body;

    // Get room context — recent tasks
    const tasks = await Task.find({ room: roomId })
      .populate('assignedTo', 'name')
      .limit(20);

    const context = tasks.map(t =>
      `Task: ${t.title} | Status: ${t.status} | Assigned to: ${t.assignedTo?.name || 'unassigned'} | Priority: ${t.priority}`
    ).join('\n');

    const answer = await askAssistant(question, context);
    res.json({ answer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST summarize chat
router.post('/summarize', isAuthenticated, async (req, res) => {
  try {
    const { roomId } = req.body;

    const messages = await Message.find({ room: roomId })
      .populate('sender', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    if (messages.length === 0) {
      return res.json({ summary: 'No messages to summarize yet.' });
    }

    const summary = await summarizeChat(messages.reverse());
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;