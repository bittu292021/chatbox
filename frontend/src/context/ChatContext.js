import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [typing, setTyping] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]); // Track online user IDs

  // Use environment variable for backend URL, fallback to localhost for development
  const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const API_URL = `${BASE_URL}/api`;
  const SOCKET_URL = BASE_URL;

  // Load saved token
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken && !token) {
      setToken(savedToken);
    }
  }, []);

  // Load profile and users when token available
  useEffect(() => {
    if (token) {
      loadProfile();
      loadUsers();
    }
  }, [token]);

  // Socket connection and event listeners
  useEffect(() => {
    if (token && user) {
      console.log('🔌 Connecting socket with user:', user);
      const newSocket = io(SOCKET_URL);

      newSocket.on('connect', () => {
        console.log('✅ Socket connected, emitting user_join with userId:', user._id);
        newSocket.emit('user_join', user._id); // Use _id (MongoDB default)
      });

      // Incoming message
      newSocket.on('receive_message', (message) => {
        console.log('📩 Received message:', message);
        setMessages(prev => [...prev, message]);
      });

      // Typing indicators
      newSocket.on('user_typing', (data) => {
        console.log('✏️ Typing event:', data);
        if (data.senderId === selectedUser?._id) {
          setTyping(`${data.senderName} is typing...`);
        }
      });

      newSocket.on('user_stop_typing', () => {
        setTyping('');
      });

      // Online/offline events
      newSocket.on('userOnline', (userId) => {
        console.log('🟢 User online:', userId);
        setOnlineUsers(prev => [...prev, userId]);
      });

      newSocket.on('userOffline', (userId) => {
        console.log('🔴 User offline:', userId);
        setOnlineUsers(prev => prev.filter(id => id !== userId));
      });

      // Error handling
      newSocket.on('connect_error', (err) => {
        console.error('❌ Socket connection error:', err.message);
      });

      setSocket(newSocket);

      return () => {
        console.log('🔌 Disconnecting socket');
        newSocket.disconnect();
      };
    }
  }, [user, token, selectedUser]); // selectedUser needed for typing

  const loadProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('👤 Profile loaded:', res.data);
      setUser(res.data);
    } catch (error) {
      console.error('Profile load error:', error);
      localStorage.removeItem('token');
      setToken(null);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('👥 Users loaded:', res.data);
      setUsers(res.data);
    } catch (error) {
      console.error('Users load error:', error);
    }
  };

  const register = async (username, email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        username, email, password
      });
      const newToken = res.data.token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(res.data.user);
      console.log('✅ Registered user:', res.data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  };

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email, password
      });
      const newToken = res.data.token;
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(res.data.user);
      console.log('✅ Logged in user:', res.data.user); // Check if user has _id or id
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setUsers([]);
    setSocket(null);
    setOnlineUsers([]);
  };

  // Send message function
  const sendMessage = (text) => {
    if (socket && selectedUser && user) {
      const messageData = {
        senderId: user._id,      // Use _id
        receiverId: selectedUser._id,
        text
      };
      console.log('📤 Sending message:', messageData);
      socket.emit('send_message', messageData);
    }
  };

  // Typing functions
  const startTyping = () => {
    if (socket && selectedUser && user) {
      socket.emit('typing', {
        senderId: user._id,
        receiverId: selectedUser._id,
        senderName: user.username
      });
    }
  };

  const stopTyping = () => {
    if (socket && selectedUser) {
      socket.emit('stop_typing', {
        receiverId: selectedUser._id
      });
    }
  };

  return (
    <ChatContext.Provider value={{
      user, token, users, selectedUser, messages, typing, socket, onlineUsers,
      register, login, logout, setSelectedUser,
      sendMessage,
      startTyping,
      stopTyping
    }}>
      {children}
    </ChatContext.Provider>
  );
};