import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ChatContext } from '../../context/ChatContext';
import './ChatWindow.css';


const MessageInput = ({ chatUser, currentUser }) => {  // 🔥 RECEIVE PROPS
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { socket } = useContext(ChatContext);
  const { user: authUser } = useContext(AuthContext);


  const handleChange = (e) => {
    setMessage(e.target.value);
    
    if (e.target.value && !isTyping) {
      setIsTyping(true);
      socket.emit('typing', { 
        to: chatUser._id, 
        from: currentUser._id,
        username: currentUser.username 
      });
    }
  };


  useEffect(() => {
    const typingTimer = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stopTyping', { to: chatUser._id });
    }, 1500);


    return () => clearTimeout(typingTimer);
  }, [message, chatUser._id, socket]);


  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && chatUser && socket) {
      // 🔥 SEND MESSAGE VIA SOCKET
      socket.emit('sendMessage', {
        to: chatUser._id,
        from: currentUser._id,
        message: message.trim(),
        username: currentUser.username,
        timestamp: new Date().toISOString()
      });
      
      setMessage('');
      setIsTyping(false);
    }
  };


  if (!chatUser) {
    return <div className="message-input">Select a user to chat</div>;
  }


  return (
    <form className="message-input" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={handleChange}
        disabled={!chatUser}
      />
      <button type="submit" disabled={!message.trim() || !chatUser}>
        Send
      </button>
    </form>
  );
};


export default MessageInput;