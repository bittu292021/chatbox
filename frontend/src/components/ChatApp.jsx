import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import axios from 'axios';
import './ChatApp.css';
import ChatWindow from './ChatWindow/ChatWindow';

const ChatApp = () => {
  const { user, logout } = useContext(AuthContext);
  const { socket } = useContext(ChatContext);
  const [users, setUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null); // 🔥 LOCAL STATE!

  // Fetch users & socket events
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/auth/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(response.data);
        console.log('✅ Users loaded:', response.data);
      } catch (error) {
        console.error('❌ Failed to fetch users:', error);
      }
    };

    if (user) {
      fetchUsers();
      
      if (socket) {
        socket.emit('join', user._id);
        console.log('📡 Joined socket room:', user._id);
        
        socket.on('userOnline', (onlineUserId) => {
          setUsers(prev => prev.map(u => 
            u._id === onlineUserId ? { ...u, isOnline: true } : u
          ));
        });
        
        socket.on('userOffline', (offlineUserId) => {
          setUsers(prev => prev.map(u => 
            u._id === offlineUserId ? { ...u, isOnline: false } : u
          ));
        });
      }
    }

    return () => {
      socket?.off('userOnline');
      socket?.off('userOffline');
    };
  }, [user, socket]);

  // 🔥 CLICK USER TO START CHAT
  const selectChat = (chatUser) => {
    setSelectedChat(chatUser);
    console.log('💬 Selected chat with:', chatUser.username);
  };

  return (
    <div className="chat-app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Chats</h2>
          <button onClick={logout}>Logout</button>
        </div>
        <div className="user-list">
          {users.length === 0 ? (
            <div>No users found</div>
          ) : (
            users.map(u => (
              <div 
                key={u._id} 
                className={`user-item ${u.isOnline ? 'online' : 'offline'}`}
                style={{
                  cursor: 'pointer',
                  padding: '12px',
                  margin: '5px 0',
                  borderRadius: '8px',
                  background: selectedChat?._id === u._id ? '#e3f2fd' : (u.isOnline ? '#e8f5e8' : '#f5f5f5'),
                  border: '1px solid #ddd'
                }}
                onClick={() => selectChat(u)} // 🔥 THIS MAKES IT CLICKABLE!
              >
                <strong>{u.username}</strong>
                <span style={{ marginLeft: '10px', fontSize: '20px' }}>
                  {u.isOnline ? '🟢' : '🔴'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      
      {selectedChat ? (
        <ChatWindow chatUser={selectedChat} /> // 🔥 PASS USER TO CHATWINDOW
      ) : (
        <div className="no-chat-selected" style={{ padding: '40px', textAlign: 'center' }}>
          <h2>Select a chat to start messaging</h2>
          <p style={{ color: '#666' }}>👈 Click any user to start chatting!</p>
        </div>
      )}
    </div>
  );
};

export default ChatApp;
