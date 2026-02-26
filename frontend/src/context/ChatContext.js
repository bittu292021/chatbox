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

  // Socket connection
  useEffect(() => {
    if (token && user) {
      const newSocket = io(SOCKET_URL);
      newSocket.emit('user_join', user.id);

      newSocket.on('receive_message', (message) => {
        setMessages(prev => [...prev, message]);
      });

      newSocket.on('user_typing', (senderName) => {
        setTyping(`${senderName} is typing...`);
      });

      newSocket.on('user_stop_typing', () => {
        setTyping('');
      });

      setSocket(newSocket);

      return () => newSocket.disconnect();
    }
  }, [user, token]);

  const loadProfile = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
  };

  return (
    <ChatContext.Provider value={{
      user, token, users, selectedUser, messages, typing, socket,
      register, login, logout, setSelectedUser, 
      sendMessage: (text) => {
        if (socket && selectedUser && user) {
          socket.emit('send_message', {
            senderId: user.id,
            receiverId: selectedUser.id,
            text
          });
        }
      }
    }}>
      {children}
    </ChatContext.Provider>
  );
};