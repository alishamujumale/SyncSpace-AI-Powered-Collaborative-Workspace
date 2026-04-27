import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDocuments, createDocument, deleteDocument } from '../api';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await getDocuments();
      setDocuments(res.data.documents);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await createDocument(title || 'Untitled Document');
      navigate(`/doc/${res.data.document._id}`);
    } catch (error) {
      console.error('Failed to create document:', error);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this document?')) return;
    try {
      await deleteDocument(id);
      setDocuments(documents.filter(doc => doc._id !== id));
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.heading}>My Documents</h2>
          <div style={styles.createSection}>
            <input
              style={styles.input}
              placeholder="Document title..."
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <button onClick={handleCreate} style={styles.createBtn}>
              + New Document
            </button>
          </div>
        </div>

        {loading ? (
          <p>Loading documents...</p>
        ) : documents.length === 0 ? (
          <div style={styles.empty}>
            <p>No documents yet. Create your first one!</p>
          </div>
        ) : (
          <div style={styles.grid}>
            {documents.map(doc => (
              <div
                key={doc._id}
                style={styles.card}
                onClick={() => navigate(`/doc/${doc._id}`)}
              >
                <h3 style={styles.cardTitle}>{doc.title}</h3>
                <p style={styles.cardMeta}>
                  By {doc.owner.name}
                </p>
                <p style={styles.cardDate}>
                  {new Date(doc.updatedAt).toLocaleDateString()}
                </p>
                <button
                  onClick={(e) => handleDelete(e, doc._id)}
                  style={styles.deleteBtn}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '32px 24px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px'
  },
  heading: {
    fontSize: '1.8rem',
    color: '#1a1a2e'
  },
  createSection: {
    display: 'flex',
    gap: '12px'
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '0.95rem',
    width: '220px'
  },
  createBtn: {
    backgroundColor: '#4285f4',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.95rem'
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: '80px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    position: 'relative'
  },
  cardTitle: {
    fontSize: '1.1rem',
    marginBottom: '8px',
    color: '#1a1a2e'
  },
  cardMeta: {
    fontSize: '0.85rem',
    color: '#888'
  },
  cardDate: {
    fontSize: '0.8rem',
    color: '#aaa',
    marginTop: '4px'
  },
  deleteBtn: {
    marginTop: '12px',
    backgroundColor: '#ff4d4d',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem'
  }
};

export default Dashboard;