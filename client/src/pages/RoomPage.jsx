import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { getRoom, getMessages, getRoomTasks, createTask, updateTask, deleteTask, generatePlan, askAI, summarizeChat } from '../api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const RoomPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typing, setTyping] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');
  const [loading, setLoading] = useState(true);

  // Task form
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', priority: 'medium',
    deadline: '', assignedTo: ''
  });

  // AI
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!room || !user) return;

    socketRef.current = io('http://localhost:5000', {
      withCredentials: true
    });

    socketRef.current.emit('join-room', { roomId: id, user });
    socketRef.current.emit('join-taskboard', { roomId: id });

    socketRef.current.on('receive-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on('user-typing', ({ name }) => {
      setTyping(`${name} is typing...`);
    });

    socketRef.current.on('user-stopped-typing', () => {
      setTyping('');
    });

    socketRef.current.on('task-added', (task) => {
      setTasks(prev => [task, ...prev]);
    });

    socketRef.current.on('task-changed', (updatedTask) => {
      setTasks(prev => prev.map(t =>
        t._id === updatedTask._id ? updatedTask : t
      ));
    });

    socketRef.current.on('task-removed', (taskId) => {
      setTasks(prev => prev.filter(t => t._id !== taskId));
    });

    return () => socketRef.current.disconnect();
  }, [room, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchData = async () => {
    try {
      const [roomRes, msgRes, taskRes] = await Promise.all([
        getRoom(id),
        getMessages(id),
        getRoomTasks(id)
      ]);
      setRoom(roomRes.data.room);
      setMessages(msgRes.data.messages);
      setTasks(taskRes.data.tasks);
    } catch (error) {
      console.error('Failed to fetch room data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    socketRef.current.emit('send-message', {
      roomId: id,
      text: newMessage,
      sender: user
    });
    socketRef.current.emit('stop-typing', { roomId: id });
    setNewMessage('');
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    socketRef.current.emit('typing', { roomId: id, user });
    clearTimeout(window.typingTimer);
    window.typingTimer = setTimeout(() => {
      socketRef.current.emit('stop-typing', { roomId: id });
    }, 1000);
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) return;
    try {
      const res = await createTask({
        ...taskForm,
        roomId: id,
        assignedTo: taskForm.assignedTo || null
      });
      setTasks(prev => [res.data.task, ...prev]);
      socketRef.current.emit('task-created', {
        roomId: id,
        task: res.data.task
      });
      setTaskForm({
        title: '', description: '',
        priority: 'medium', deadline: '', assignedTo: ''
      });
      setShowTaskForm(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      const res = await updateTask(task._id, { ...task, status: newStatus });
      setTasks(prev => prev.map(t =>
        t._id === task._id ? res.data.task : t
      ));
      socketRef.current.emit('task-updated', {
        roomId: id,
        task: res.data.task
      });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
      setTasks(prev => prev.filter(t => t._id !== taskId));
      socketRef.current.emit('task-deleted', { roomId: id, taskId });
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleAICommand = async () => {
    if (!aiInput.trim()) return;
    setAiLoading(true);
    setAiResponse('');
    try {
      if (aiInput.startsWith('/generate-plan')) {
        const idea = aiInput.replace('/generate-plan', '').trim();
        const res = await generatePlan(idea, id);
        const plan = res.data.plan;
        setAiResponse(
          `✅ Plan generated!\n\n📌 ${plan.projectName}\n${plan.summary}\n\n` +
          `🗓 Timeline: ${plan.timeline}\n\n` +
          `👥 Roles: ${plan.suggestedRoles?.join(', ')}\n\n` +
          `✅ ${res.data.tasks.length} tasks created automatically!`
        );
        const taskRes = await getRoomTasks(id);
        setTasks(taskRes.data.tasks);
      } else if (aiInput.startsWith('/summarize')) {
        const res = await summarizeChat(id);
        setAiResponse(`📝 Chat Summary:\n\n${res.data.summary}`);
      } else {
        const res = await askAI(aiInput, id);
        setAiResponse(res.data.answer);
      }
    } catch (error) {
      setAiResponse('❌ AI error: ' + error.message);
    } finally {
      setAiLoading(false);
      setAiInput('');
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const overdueTasks = tasks.filter(t =>
    t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed'
  );
  const progress = tasks.length > 0
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  if (loading) return <div style={styles.loading}>Loading workspace...</div>;
  if (!room) return <div style={styles.loading}>Room not found</div>;

  return (
    <div>
      <Navbar />
      <div style={styles.container}>

        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.roomInfo}>
            <h2 style={styles.roomName}>{room.name}</h2>
            <p style={styles.roomDesc}>{room.description}</p>
            <div style={styles.inviteBox}>
              <span style={styles.inviteLabel}>Invite code:</span>
              <code style={styles.inviteCode}>{room.inviteCode}</code>
              <button
                style={styles.copyBtn}
                onClick={() => navigator.clipboard.writeText(room.inviteCode)}
              >Copy</button>
            </div>
          </div>

          {/* Progress */}
          <div style={styles.progressBox}>
            <div style={styles.progressLabel}>
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div style={styles.progressTrack}>
              <div style={{ ...styles.progressFill, width: `${progress}%` }} />
            </div>
            <div style={styles.taskStats}>
              <span style={styles.statPending}>⏳ {pendingTasks.length} pending</span>
              <span style={styles.statProgress}>🔄 {inProgressTasks.length} in progress</span>
              <span style={styles.statDone}>✅ {completedTasks.length} done</span>
              {overdueTasks.length > 0 && (
                <span style={styles.statOverdue}>🔴 {overdueTasks.length} overdue</span>
              )}
            </div>
          </div>

          {/* Members */}
          <div style={styles.membersBox}>
            <h4 style={styles.sectionTitle}>👥 Members</h4>
            {room.members.map((member, i) => (
              <div key={i} style={styles.memberRow}>
                <img src={member.avatar} alt={member.name} style={styles.memberAvatar} />
                <span style={styles.memberName}>
                  {member.name}
                  {room.leader._id === member._id && (
                    <span style={styles.leaderBadge}> 👑</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={styles.tabs}>
            {['tasks', 'chat', 'ai'].map(tab => (
              <button
                key={tab}
                style={{
                  ...styles.tab,
                  ...(activeTab === tab ? styles.activeTab : {})
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'tasks' ? '📋 Tasks' : tab === 'chat' ? '💬 Chat' : '🤖 AI'}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div style={styles.main}>

          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <div>
              <div style={styles.tabHeader}>
                <h3 style={styles.tabTitle}>📋 Task Board</h3>
                <button
                  style={styles.addBtn}
                  onClick={() => setShowTaskForm(!showTaskForm)}
                >+ Add Task</button>
              </div>

              {showTaskForm && (
                <div style={styles.taskForm}>
                  <input
                    style={styles.input}
                    placeholder="Task title *"
                    value={taskForm.title}
                    onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                  />
                  <textarea
                    style={styles.textarea}
                    placeholder="Description"
                    value={taskForm.description}
                    onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                  />
                  <div style={styles.formRow}>
                    <select
                      style={styles.select}
                      value={taskForm.priority}
                      onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                    >
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🔴 High</option>
                    </select>
                    <input
                      type="date"
                      style={styles.input}
                      value={taskForm.deadline}
                      onChange={e => setTaskForm({ ...taskForm, deadline: e.target.value })}
                    />
                  </div>
                  <select
                    style={styles.select}
                    value={taskForm.assignedTo}
                    onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                  >
                    <option value="">Assign to...</option>
                    {room.members.map(m => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                  <div style={styles.formRow}>
                    <button style={styles.saveBtn} onClick={handleCreateTask}>
                      Create Task
                    </button>
                    <button
                      style={styles.cancelBtn}
                      onClick={() => setShowTaskForm(false)}
                    >Cancel</button>
                  </div>
                </div>
              )}

              {/* Task columns */}
              <div style={styles.kanban}>
                {[
                  { label: '⏳ Pending', items: pendingTasks, status: 'pending', color: '#f0a500' },
                  { label: '🔄 In Progress', items: inProgressTasks, status: 'in-progress', color: '#4285f4' },
                  { label: '✅ Completed', items: completedTasks, status: 'completed', color: '#34a853' }
                ].map(col => (
                  <div key={col.status} style={styles.column}>
                    <div style={{ ...styles.columnHeader, borderColor: col.color }}>
                      <span>{col.label}</span>
                      <span style={styles.columnCount}>{col.items.length}</span>
                    </div>
                    {col.items.map(task => (
                      <div key={task._id} style={styles.taskCard}>
                        <div style={styles.taskTop}>
                          <span style={styles.taskTitle}>{task.title}</span>
                          <span style={{
                            ...styles.priorityBadge,
                            backgroundColor:
                              task.priority === 'high' ? '#ffe0e0' :
                              task.priority === 'medium' ? '#fff3cd' : '#e8f5e9',
                            color:
                              task.priority === 'high' ? '#c62828' :
                              task.priority === 'medium' ? '#f57f17' : '#2e7d32'
                          }}>
                            {task.priority}
                          </span>
                        </div>
                        {task.description && (
                          <p style={styles.taskDesc}>{task.description}</p>
                        )}
                        {task.assignedTo && (
                          <div style={styles.assignedRow}>
                            <img
                              src={task.assignedTo.avatar}
                              alt={task.assignedTo.name}
                              style={styles.assignedAvatar}
                            />
                            <span style={styles.assignedName}>{task.assignedTo.name}</span>
                          </div>
                        )}
                        {task.deadline && (
                          <p style={{
                            ...styles.deadline,
                            color: new Date(task.deadline) < new Date() &&
                              task.status !== 'completed' ? '#c62828' : '#888'
                          }}>
                            📅 {new Date(task.deadline).toLocaleDateString()}
                          </p>
                        )}
                        <div style={styles.taskActions}>
                          {task.status !== 'in-progress' && (
                            <button
                              style={styles.actionBtn}
                              onClick={() => handleStatusChange(task, 'in-progress')}
                            >▶ Start</button>
                          )}
                          {task.status !== 'completed' && (
                            <button
                              style={{ ...styles.actionBtn, color: '#34a853' }}
                              onClick={() => handleStatusChange(task, 'completed')}
                            >✓ Done</button>
                          )}
                          {task.status !== 'pending' && (
                            <button
                              style={{ ...styles.actionBtn, color: '#f0a500' }}
                              onClick={() => handleStatusChange(task, 'pending')}
                            >↩ Reopen</button>
                          )}
                          <button
                            style={{ ...styles.actionBtn, color: '#e53935' }}
                            onClick={() => handleDeleteTask(task._id)}
                          >🗑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'chat' && (
            <div style={styles.chatContainer}>
              <h3 style={styles.tabTitle}>💬 Team Chat</h3>
              <div style={styles.messageList}>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      ...styles.messageRow,
                      flexDirection: msg.sender._id === user._id ? 'row-reverse' : 'row'
                    }}
                  >
                    <img
                      src={msg.sender.avatar}
                      alt={msg.sender.name}
                      style={styles.msgAvatar}
                    />
                    <div style={{
                      ...styles.messageBubble,
                      backgroundColor: msg.sender._id === user._id ? '#4285f4' : '#f1f3f4',
                      color: msg.sender._id === user._id ? 'white' : '#1a1a2e'
                    }}>
                      {msg.sender._id !== user._id && (
                        <div style={styles.msgSender}>{msg.sender.name}</div>
                      )}
                      <div>{msg.text}</div>
                      <div style={styles.msgTime}>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                {typing && <div style={styles.typing}>{typing}</div>}
                <div ref={messagesEndRef} />
              </div>
              <div style={styles.chatInput}>
                <input
                  style={styles.msgInput}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                />
                <button style={styles.sendBtn} onClick={handleSendMessage}>
                  Send
                </button>
              </div>
            </div>
          )}

          {/* AI TAB */}
          {activeTab === 'ai' && (
            <div style={styles.aiContainer}>
              <h3 style={styles.tabTitle}>🤖 AI Assistant</h3>
              <div style={styles.aiCommands}>
                <p style={styles.aiHint}>Available commands:</p>
                {[
                  '/generate-plan Build a food delivery app',
                  '/summarize',
                  'What tasks are pending?',
                  'Who is overloaded?'
                ].map((cmd, i) => (
                  <button
                    key={i}
                    style={styles.cmdBtn}
                    onClick={() => setAiInput(cmd)}
                  >{cmd}</button>
                ))}
              </div>
              <div style={styles.aiInputRow}>
                <input
                  style={styles.aiInput}
                  placeholder="Ask AI or use /commands..."
                  value={aiInput}
                  onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAICommand()}
                />
                <button
                  style={styles.sendBtn}
                  onClick={handleAICommand}
                  disabled={aiLoading}
                >
                  {aiLoading ? '...' : 'Ask'}
                </button>
              </div>
              {aiResponse && (
                <div style={styles.aiResponse}>
                  <pre style={styles.aiResponseText}>{aiResponse}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#888' },
  container: { display: 'flex', height: 'calc(100vh - 60px)', overflow: 'hidden' },
  sidebar: { width: '280px', borderRight: '1px solid #eee', overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' },
  roomInfo: { paddingBottom: '16px', borderBottom: '1px solid #eee' },
  roomName: { fontSize: '1.3rem', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '4px' },
  roomDesc: { fontSize: '0.85rem', color: '#888', marginBottom: '12px' },
  inviteBox: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f8f9fa', padding: '8px', borderRadius: '8px' },
  inviteLabel: { fontSize: '0.75rem', color: '#888' },
  inviteCode: { fontSize: '0.9rem', fontWeight: 'bold', color: '#4285f4', flex: 1 },
  copyBtn: { backgroundColor: '#4285f4', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' },
  progressBox: { padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '10px' },
  progressLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: '#1a1a2e' },
  progressTrack: { height: '8px', backgroundColor: '#e0e0e0', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' },
  progressFill: { height: '100%', backgroundColor: '#34a853', borderRadius: '4px', transition: 'width 0.3s' },
  taskStats: { display: 'flex', flexDirection: 'column', gap: '4px' },
  statPending: { fontSize: '0.8rem', color: '#f0a500' },
  statProgress: { fontSize: '0.8rem', color: '#4285f4' },
  statDone: { fontSize: '0.8rem', color: '#34a853' },
  statOverdue: { fontSize: '0.8rem', color: '#e53935' },
  membersBox: { paddingBottom: '16px', borderBottom: '1px solid #eee' },
  sectionTitle: { fontSize: '0.9rem', fontWeight: 'bold', color: '#1a1a2e', marginBottom: '10px' },
  memberRow: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  memberAvatar: { width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' },
  memberName: { fontSize: '0.85rem', color: '#444' },
  leaderBadge: { fontSize: '0.75rem' },
  tabs: { display: 'flex', gap: '4px' },
  tab: { flex: 1, padding: '8px 4px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer', fontSize: '0.8rem', color: '#666' },
  activeTab: { backgroundColor: '#1a1a2e', color: 'white', border: '1px solid #1a1a2e' },
  main: { flex: 1, overflowY: 'auto', padding: '24px' },
  tabHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  tabTitle: { fontSize: '1.3rem', fontWeight: 'bold', color: '#1a1a2e' },
  addBtn: { backgroundColor: '#4285f4', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem' },
  taskForm: { backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '10px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' },
  textarea: { padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem', minHeight: '80px', resize: 'vertical' },
  select: { padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.95rem', flex: 1 },
  formRow: { display: 'flex', gap: '10px' },
  saveBtn: { backgroundColor: '#4285f4', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', flex: 1 },
  cancelBtn: { backgroundColor: '#eee', color: '#444', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', flex: 1 },
  kanban: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  column: { backgroundColor: '#f8f9fa', borderRadius: '10px', padding: '12px' },
  columnHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: '3px solid', fontSize: '0.9rem', fontWeight: 'bold', color: '#1a1a2e' },
  columnCount: { backgroundColor: '#1a1a2e', color: 'white', borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem' },
  taskCard: { backgroundColor: 'white', borderRadius: '8px', padding: '12px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  taskTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' },
  taskTitle: { fontSize: '0.9rem', fontWeight: 'bold', color: '#1a1a2e', flex: 1 },
  priorityBadge: { fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold', marginLeft: '6px', whiteSpace: 'nowrap' },
  taskDesc: { fontSize: '0.8rem', color: '#666', marginBottom: '8px' },
  assignedRow: { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' },
  assignedAvatar: { width: '20px', height: '20px', borderRadius: '50%' },
  assignedName: { fontSize: '0.8rem', color: '#4285f4' },
  deadline: { fontSize: '0.78rem', marginBottom: '8px' },
  taskActions: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
  actionBtn: { backgroundColor: 'transparent', border: '1px solid #eee', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', color: '#4285f4' },
  chatContainer: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' },
  messageList: { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '12px' },
  messageRow: { display: 'flex', alignItems: 'flex-end', gap: '8px' },
  msgAvatar: { width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  messageBubble: { maxWidth: '70%', padding: '10px 14px', borderRadius: '12px' },
  msgSender: { fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '4px', opacity: 0.7 },
  msgTime: { fontSize: '0.7rem', opacity: 0.6, marginTop: '4px', textAlign: 'right' },
  typing: { fontSize: '0.8rem', color: '#888', fontStyle: 'italic', padding: '4px 8px' },
  chatInput: { display: 'flex', gap: '10px', paddingTop: '12px', borderTop: '1px solid #eee' },
  msgInput: { flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '0.95rem', outline: 'none' },
  sendBtn: { backgroundColor: '#4285f4', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.95rem' },
  aiContainer: { display: 'flex', flexDirection: 'column', gap: '16px' },
  aiCommands: { backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '10px' },
  aiHint: { fontSize: '0.85rem', color: '#888', marginBottom: '10px' },
  cmdBtn: { display: 'block', width: '100%', textAlign: 'left', backgroundColor: 'white', border: '1px solid #eee', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#4285f4', marginBottom: '6px' },
  aiInputRow: { display: 'flex', gap: '10px' },
  aiInput: { flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '0.95rem', outline: 'none' },
  aiResponse: { backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '10px', border: '1px solid #eee' },
  aiResponseText: { whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: '#1a1a2e', margin: 0, fontFamily: 'inherit' }
};

export default RoomPage;