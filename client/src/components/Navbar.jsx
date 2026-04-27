import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logout } from '../api';

const Navbar = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate('/');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.logo} onClick={() => navigate('/dashboard')}>
        🔄 SyncSpace
      </div>
      <div style={styles.userSection}>
        {user && (
          <>
            <img
              src={user.avatar}
              alt={user.name}
              style={styles.avatar}
            />
            <span style={styles.name}>{user.name}</span>
            <button onClick={handleLogout} style={styles.button}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px',
    height: '60px',
    backgroundColor: '#1a1a2e',
    color: 'white',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
  },
  logo: {
    fontSize: '1.4rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
 avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid white',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
  },
  name: {
    fontSize: '0.95rem'
  },
  button: {
    backgroundColor: 'transparent',
    color: 'white',
    border: '1px solid white',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  }
};

export default Navbar;