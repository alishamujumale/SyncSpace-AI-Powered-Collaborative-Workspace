import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRooms, createRoom, joinRoom, deleteRoom } from '../api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomDesc, setRoomDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await getRooms();
      setRooms(res.data.rooms);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    try {
      const res = await createRoom({ name: roomName, description: roomDesc });
      setRooms([res.data.room, ...rooms]);
      setRoomName('');
      setRoomDesc('');
      setShowCreate(false);
      navigate(`/room/${res.data.room._id}`);
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const handleJoinRoom = async () => {
    if (!inviteCode.trim()) return;
    try {
      const res = await joinRoom(inviteCode.trim().toUpperCase());
      setRooms([res.data.room, ...rooms]);
      setInviteCode('');
      setShowJoin(false);
      navigate(`/room/${res.data.room._id}`);
    } catch (error) {
      alert('Invalid invite code. Please try again.');
    }
  };

  const handleDeleteRoom = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this room?')) return;
    try {
      await deleteRoom(id);
      setRooms(rooms.filter(r => r._id !== id));
    } catch (error) {
      console.error('Failed to delete room:', error);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.heading}>👋 Welcome, {user?.name?.split(' ')[0]}!</h2>
            <p style={styles.subheading}>Your team workspaces</p>
          </div>
          <div style={styles.headerBtns}>
            <button
              style={styles.joinBtn}
              onClick={() => { setShowJoin(!showJoin); setShowCreate(false); }}
            >🔗 Join Room</button>
            <button
              style={styles.createBtn}
              onClick={() => { setShowCreate(!showCreate); setShowJoin(false); }}
            >+ Create Room</button>
          </div>
        </div>

        {/* Create room form */}
        {showCreate && (
          <div style={styles.formBox}>
            <h4 style={styles.formTitle}>Create a new room</h4>
            <input
              style={styles.input}
              placeholder="Room name *"
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
            />
            <input
              style={styles.input}
              placeholder="Description (optional)"
              value={roomDesc}
              onChange={e => setRoomDesc(e.target.value)}
            />
            <div style={styles.formRow}>
              <button style={styles.saveBtn} onClick={handleCreateRoom}>
                Create
              </button>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowCreate(false)}
              >Cancel</button>
            </div>
          </div>
        )}

        {/* Join room form */}
        {showJoin && (
          <div style={styles.formBox}>
            <h4 style={styles.formTitle}>Join a room</h4>
            <input
              style={styles.input}
              placeholder="Enter invite code (e.g. AB12CD34)"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
            />
            <div style={styles.formRow}>
              <button style={styles.saveBtn} onClick={handleJoinRoom}>
                Join
              </button>
              <button
                style={styles.cancelBtn}
                onClick={() => setShowJoin(false)}
              >Cancel</button>
            </div>
          </div>
        )}

        {/* Rooms grid */}
        {loading ? (
          <p style={styles.loading}>Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <div style={styles.empty}>
            <p style={styles.emptyTitle}>No rooms yet</p>
            <p style={styles.emptySubtitle}>
              Create a room to start collaborating with your team!
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {rooms.map(room => (
              <div
                key={room._id}
                style={styles.card}
                onClick={() => navigate(`/room/${room._id}`)}
              >
                <div style={styles.cardTop}>
                  <h3 style={styles.cardTitle}>{room.name}</h3>
                  {room.leader._id === user?._id && (
                    <span style={styles.leaderBadge}>👑 Leader</span>
                  )}
                </div>
                {room.description && (
                  <p style={styles.cardDesc}>{room.description}</p>
                )}
                <div style={styles.cardMembers}>
                  {room.members.slice(0, 4).map((m, i) => (
                    <img
                      key={i}
                      src={m.avatar}
                      alt={m.name}
                      style={{ ...styles.memberAvatar, marginLeft: i > 0 ? '-8px' : 0 }}
                      title={m.name}
                    />
                  ))}
                  {room.members.length > 4 && (
                    <span style={styles.moreMembers}>
                      +{room.members.length - 4}
                    </span>
                  )}
                  <span style={styles.memberCount}>
                    {room.members.length} member{room.members.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={styles.cardFooter}>
                  <span style={styles.cardDate}>
                    {new Date(room.updatedAt).toLocaleDateString()}
                  </span>
                  {room.leader._id === user?._id && (
                    <button
                      onClick={(e) => handleDeleteRoom(e, room._id)}
                      style={styles.deleteBtn}
                    >Delete</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' },
  heading: { fontSize: '1.8rem', color: '#1a1a2e', marginBottom: '4px' },
  subheading: { color: '#888', fontSize: '0.95rem' },
  headerBtns: { display: 'flex', gap: '12px' },
  joinBtn: { backgroundColor: 'white', color: '#1a1a2e', border: '2px solid #1a1a2e', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 'bold' },
  createBtn: { backgroundColor: '#4285f4', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 'bold' },
  formBox: { backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '12px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' },
  formTitle: { fontSize: '1rem', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '4px' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem' },
  formRow: { display: 'flex', gap: '10px' },
  saveBtn: { flex: 1, backgroundColor: '#4285f4', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem' },
  cancelBtn: { flex: 1, backgroundColor: '#eee', color: '#444', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem' },
  loading: { color: '#888', textAlign: 'center', marginTop: '60px' },
  empty: { textAlign: 'center', marginTop: '80px' },
  emptyTitle: { fontSize: '1.3rem', color: '#444', marginBottom: '8px' },
  emptySubtitle: { color: '#888' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid #f0f0f0' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  cardTitle: { fontSize: '1.1rem', fontWeight: 'bold', color: '#1a1a2e' },
  leaderBadge: { fontSize: '0.75rem', backgroundColor: '#fff3cd', color: '#856404', padding: '3px 8px', borderRadius: '10px' },
  cardDesc: { fontSize: '0.85rem', color: '#888', marginBottom: '12px' },
  cardMembers: { display: 'flex', alignItems: 'center', marginBottom: '12px' },
  memberAvatar: { width: '28px', height: '28px', borderRadius: '50%', border: '2px solid white', objectFit: 'cover' },
  moreMembers: { fontSize: '0.75rem', color: '#888', marginLeft: '8px' },
  memberCount: { fontSize: '0.8rem', color: '#888', marginLeft: '10px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { fontSize: '0.8rem', color: '#aaa' },
  deleteBtn: { backgroundColor: '#ff4d4d', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }
};

export default Dashboard;