import React from 'react';
import './ChatWindow.css';

const MessageList = ({ messages, currentUserId, currentUsername }) => {  // 🔥 ADDED currentUsername
  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          No messages yet. Start the conversation!
        </div>
      ) : (
        messages.map((msg, index) => (
          <div 
            key={msg.timestamp || index} 
            className={`message ${msg.from === currentUserId ? 'sent' : 'received'}`}
          >
            <div className="message-content">
              {/* ✅ PERFECT USERNAME LOGIC - No more "Unknown"! */}
              <strong>
                {msg.username || 
                 (msg.from === currentUserId ? currentUsername : 'User') ||
                 msg.sender?.username || 
                 msg.from || 
                 'User'}
              </strong>
              <p>{msg.message || msg.content || 'No message'}</p>
              <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MessageList;
