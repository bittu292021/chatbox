import React, { useContext, useState } from 'react';
import { AuthContext } from './context/AuthContext';
import { ChatProvider } from './context/ChatContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatApp from './components/ChatApp';
import './App.css';

function App() {
  const { token, loading } = useContext(AuthContext);
  const [showRegister, setShowRegister] = React.useState(false);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!token) {
    return showRegister ? (
      <Register onSwitch={() => setShowRegister(false)} />
    ) : (
      <Login onSwitch={() => setShowRegister(true)} />
    );
  }

  return (
    <ChatProvider>
      <ChatApp />
    </ChatProvider>
  );
}

export default App;
