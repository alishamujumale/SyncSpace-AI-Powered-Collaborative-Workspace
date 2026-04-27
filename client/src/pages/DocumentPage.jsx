import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDocument, updateDocument, getComments, addComment, deleteComment } from '../api';
import Navbar from '../components/Navbar';

const DocumentPage = () => {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocument();
    fetchComments();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const res = await getDocument(id);
      setDocument(res.data.document);
      setContent(res.data.document.content);
      setTitle(res.data.document.title);
    } catch (error) {
      console.error('Failed to fetch document:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await getComments(id);
      setComments(res.data.comments);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDocument(id, { title, content });
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const res = await addComment(id, newComment);
      setComments([...comments, res.data.comment]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  if (loading) return <div>Loading document...</div>;
  if (!document) return <div>Document not found</div>;

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.editorSection}>
          <input
            style={styles.titleInput}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Document title..."
          />
          <textarea
            style={styles.editor}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Start typing..."
          />
          <button onClick={handleSave} style={styles.saveBtn}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        <div style={styles.commentSection}>
          <h3 style={styles.commentHeading}>Comments</h3>
          <div style={styles.commentList}>
            {comments.length === 0 ? (
              <p style={styles.noComments}>No comments yet</p>
            ) : (
              comments.map(comment => (
                <div key={comment._id} style={styles.commentCard}>
                  <div style={styles.commentHeader}>
                    <img
                      src={comment.author.avatar}
                      alt={comment.author.name}
                      style={styles.avatar}
                    />
                    <span style={styles.commentAuthor}>
                      {comment.author.name}
                    </span>
                  </div>
                  <p style={styles.commentText}>{comment.text}</p>
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    style={styles.deleteBtn}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
          <div style={styles.addComment}>
            <textarea
              style={styles.commentInput}
              placeholder="Add a comment..."
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <button onClick={handleAddComment} style={styles.commentBtn}>
              Add Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px'
  },
  editorSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  titleInput: {
    fontSize: '1.6rem',
    fontWeight: 'bold',
    border: 'none',
    borderBottom: '2px solid #eee',
    padding: '8px 0',
    outline: 'none',
    color: '#1a1a2e'
  },
  editor: {
    flex: 1,
    minHeight: '500px',
    padding: '16px',
    fontSize: '1rem',
    border: '1px solid #eee',
    borderRadius: '8px',
    resize: 'vertical',
    outline: 'none',
    lineHeight: '1.6'
  },
  saveBtn: {
    backgroundColor: '#4285f4',
    color: 'white',
    border: 'none',
    padding: '10px 24px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    alignSelf: 'flex-end'
  },
  commentSection: {
    width: '300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  commentHeading: {
    fontSize: '1.2rem',
    color: '#1a1a2e'
  },
  commentList: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  noComments: {
    color: '#aaa',
    fontSize: '0.9rem'
  },
  commentCard: {
    backgroundColor: 'white',
    padding: '12px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  commentHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px'
  },
  avatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%'
  },
  commentAuthor: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    color: '#1a1a2e'
  },
  commentText: {
    fontSize: '0.9rem',
    color: '#444'
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    color: '#ff4d4d',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    padding: '0'
  },
  addComment: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  commentInput: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '0.9rem',
    resize: 'none',
    minHeight: '80px'
  },
  commentBtn: {
    backgroundColor: '#1a1a2e',
    color: 'white',
    border: 'none',
    padding: '10px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  }
};

export default DocumentPage;