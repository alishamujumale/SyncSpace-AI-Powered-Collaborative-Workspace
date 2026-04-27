import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user, loading } = useAuth();

  // If already logged in, go straight to dashboard
  if (loading) return <div>Loading...</div>;
  if (user) return <Navigate to="/dashboard" />;

  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/auth/google';
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🔄 SyncSpace</h1>
        <p style={styles.subtitle}>
          Real-time collaborative document editing
        </p>
        <button onClick={handleLogin} style={styles.button}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f0f2f5'
  },
  card: {
    backgroundColor: 'white',
    padding: '48px',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%'
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '12px',
    color: '#1a1a2e'
  },
  subtitle: {
    color: '#666',
    marginBottom: '32px',
    fontSize: '1.1rem'
  },
  button: {
    backgroundColor: '#4285f4',
    color: 'white',
    border: 'none',
    padding: '14px 28px',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    width: '100%'
  }
};

export default Home;