import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import { loadSessions, saveSessions, createNewSession, migrateLegacyHistory } from './services/chatStorage';
import './App.css';

function App() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);
  const sidebarRef = React.useRef(null);

  // Initial Load & Migration
  useEffect(() => {
    migrateLegacyHistory();
    const loadedSessions = loadSessions();
    setSessions(loadedSessions);

    if (loadedSessions.length > 0) {
      // Pick most recent or first
      setActiveSessionId(loadedSessions[0].id);
    } else {
      handleNewChat();
    }
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Persist sessions whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      saveSessions(sessions);
    }
  }, [sessions]);

  const handleNewChat = () => {
    const newSession = createNewSession({
      id: 'welcome',
      text: "Hello! I'm your AI assistant. I'm connected to Google Gemini. How can I help you?",
      isUser: false,
      timestamp: Date.now()
    });
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this chat?')) {
      const updated = sessions.filter(s => s.id !== sessionId);
      setSessions(updated);

      // If we deleted the active session, switch to another
      if (activeSessionId === sessionId) {
        if (updated.length > 0) {
          setActiveSessionId(updated[0].id);
        } else {
          // No sessions left, create new
          handleNewChat();
        }
      } else if (updated.length === 0) {
        handleNewChat();
      }
    }
  };

  const handleUpdateMessages = (sessionId, messagesOrUpdater) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        // Auto-generate title from first user message if title is default
        let newMessages;
        if (typeof messagesOrUpdater === 'function') {
          newMessages = messagesOrUpdater(session.messages);
        } else {
          newMessages = messagesOrUpdater;
        }

        let title = session.title;
        if (title === 'New Chat') {
          const firstUserMsg = newMessages.find(m => m.isUser);
          if (firstUserMsg) {
            title = firstUserMsg.text.slice(0, 30) + (firstUserMsg.text.length > 30 ? '...' : '');
          }
        }
        return { ...session, messages: newMessages, title, updatedAt: Date.now() };
      }
      return session;
    }));
  };

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setInstallPrompt(null);
      }
    });
  };

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  // Dummy handler for settings since it's internal to ChatArea in current design
  // We can refactor Settings to be global later if needed
  const handleOpenSettings = () => {
    // You might want to pass a prop to ChatArea to open settings, 
    // or just keep the button inside ChatArea header for now.
    // For this phase, we'll keep it simple.
  };

  const handleFocusSearch = () => {
    sidebarRef.current?.focusSearch();
  };

  return (
    <div className="app-container">
      <Sidebar
        ref={sidebarRef}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={setActiveSessionId}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onOpenSettings={handleOpenSettings}
        installPrompt={installPrompt}
        onInstallApp={handleInstallClick}
      />
      {activeSession ? (
        <ChatArea
          key={activeSession.id} // Force remount on session switch
          messages={activeSession.messages}
          onUpdateMessages={(msgs) => handleUpdateMessages(activeSession.id, msgs)}
          onFocusSearch={handleFocusSearch}
        />
      ) : (
        <div className="loading">Loading...</div>
      )}
    </div>
  );
}

export default App;
