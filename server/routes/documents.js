const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const Version = require('../models/Version');
const isAuthenticated = require('../middleware/isAuthenticated');
const { v4: uuidv4 } = require('uuid');

// GET all documents for logged in user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const documents = await Document.find({
      $or: [
        { owner: req.user._id },
        { collaborators: req.user._id }
      ]
    }).populate('owner', 'name avatar').sort({ updatedAt: -1 });

    res.json({ documents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single document by ID
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('owner', 'name avatar')
      .populate('collaborators', 'name avatar');

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if user has access
    const hasAccess = document.owner._id.equals(req.user._id) ||
      document.collaborators.some(c => c._id.equals(req.user._id)) ||
      document.isPublic;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ document });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new document
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const document = await Document.create({
      title: req.body.title || 'Untitled Document',
      content: '',
      owner: req.user._id,
      shareId: uuidv4()  // unique sharing link
    });

    res.status(201).json({ document });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update document
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Only owner or collaborators can edit
    const canEdit = document.owner.equals(req.user._id) ||
      document.collaborators.some(c => c.equals(req.user._id));

    if (!canEdit) {
      return res.status(403).json({ error: 'Access denied' });
    }

    document.title = req.body.title || document.title;
    document.content = req.body.content ?? document.content;
    await document.save();

    res.json({ document });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE document (owner only)
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (!document.owner.equals(req.user._id)) {
      return res.status(403).json({ error: 'Only the owner can delete this document' });
    }

    await document.deleteOne();
    res.json({ message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET version history for a document
router.get('/:id/versions', isAuthenticated, async (req, res) => {
  try {
    const versions = await Version.find({ document: req.params.id })
      .populate('savedBy', 'name avatar')
      .sort({ versionNumber: -1 });

    res.json({ versions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET document by shareId (public sharing link)
router.get('/share/:shareId', async (req, res) => {
  try {
    const document = await Document.findOne({ shareId: req.params.shareId })
      .populate('owner', 'name avatar');

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({ document });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;