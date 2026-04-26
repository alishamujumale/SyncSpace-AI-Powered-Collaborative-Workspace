const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const isAuthenticated = require('../middleware/isAuthenticated');

// GET all comments for a document
router.get('/:docId', isAuthenticated, async (req, res) => {
  try {
    const comments = await Comment.find({ document: req.params.docId })
      .populate('author', 'name avatar')
      .sort({ createdAt: 1 });

    res.json({ comments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST add a comment
router.post('/:docId', isAuthenticated, async (req, res) => {
  try {
    const comment = await Comment.create({
      document: req.params.docId,
      author: req.user._id,
      text: req.body.text
    });

    const populated = await comment.populate('author', 'name avatar');
    res.status(201).json({ comment: populated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a comment
router.delete('/:commentId', isAuthenticated, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (!comment.author.equals(req.user._id)) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    await comment.deleteOne();
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;