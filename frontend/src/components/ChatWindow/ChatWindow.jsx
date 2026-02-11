import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ChatContext } from '../../context/ChatContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './ChatWindow.css';

const ChatWindow = ({ chatUser }) => {  // 🔥 RECEIVE chatUser prop
  const { user: currentUser } = useContext(AuthContext);
  const { socket, messages, setMessages } = useContext(ChatContext);
  const [newMessages, setNewMessages] = useState([]);

  useEffect(() => {
    if (!chatUser || !socket || !currentUser) return;

    // Clear messages when switching chats
    

    // Listen for messages from selected user
    socket.on('receiveMessage', (data) => {
      if (data.to === currentUser._id || data.from === currentUser._id) {
        setNewMessages(prev => [...prev, data]);
      }
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [chatUser, socket, currentUser, setMessages]);

  return (
    <div className="chat-window">
      <div className="chat-header">
        {/* 🔥 SHOW SELECTED USER NAME */}
        <h2>Chat with {chatUser?.username || 'Loading...'}</h2>
        <span className={chatUser?.isOnline ? 'online' : 'offline'}>
          {chatUser?.isOnline ? '🟢 Online' : '🔴 Offline'}
        </span>
      </div>
      <MessageList messages={newMessages} currentUserId={currentUser._id} currentUsername={currentUser.username} />
      <MessageInput chatUser={chatUser} currentUser={currentUser} messages={newMessages} setMessages={setNewMessages} />
    </div>
  );
};

export default ChatWindow;
