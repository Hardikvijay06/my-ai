import React, { useState, useImperativeHandle, forwardRef, useRef } from 'react';
import './Sidebar.css';

const Sidebar = forwardRef(({ sessions, activeSessionId, onSelectSession, onNewChat, onDeleteSession, onOpenSettings, installPrompt, onInstallApp }, ref) => {
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focusSearch: () => {
            searchInputRef.current?.focus();
        }
    }));

    const filteredSessions = sessions.filter(session =>
        session.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <nav className="sidebar glass" aria-label="Sidebar">
            <div className="sidebar-header">
                <h1 className="brand-title">MyAI</h1>
            </div>

            <button
                className="new-chat-btn"
                onClick={onNewChat}
                aria-label="Start a new chat"
            >
                <span className="plus-icon" aria-hidden="true">+</span> New Chat
            </button>

            <div className="search-container">
                <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search chats... (Cmd+K)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="sidebar-search"
                    aria-label="Search chats"
                />
            </div>

            <div className="recent-chats" role="list">
                <div className="recent-chats-label">Chats ({filteredSessions.length})</div>
                {filteredSessions.map(session => (
                    <div
                        key={session.id}
                        role="listitem"
                        className={`chat-item ${session.id === activeSessionId ? 'active' : ''}`}
                        onClick={() => onSelectSession(session.id)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                onSelectSession(session.id);
                            }
                        }}
                        tabIndex={0}
                        aria-label={`Chat: ${session.title}`}
                    >
                        <span className="chat-icon" aria-hidden="true">💬</span>
                        <span className="chat-title" title={session.title}>{session.title}</span>
                        <button
                            className="delete-session-btn"
                            onClick={(e) => onDeleteSession(e, session.id)}
                            title="Delete Chat"
                            aria-label={`Delete chat ${session.title}`}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            <div className="sidebar-footer">
                {/* Install App Button - Only visible if installPrompt is available */}
                {installPrompt && (
                    <button
                        className="install-app-btn"
                        onClick={onInstallApp}
                        aria-label="Install App"
                    >
                        <span style={{ marginRight: '8px' }} aria-hidden="true">⬇️</span> Install App
                    </button>
                )}

                <button
                    className="user-profile"
                    onClick={onOpenSettings}
                    title="Settings"
                    aria-label="Open Settings"
                >
                    <div className="avatar" aria-hidden="true">⚙️</div>
                    <div className="user-info">
                        <span className="user-name">Settings</span>
                        <span className="user-plan">Global Config</span>
                    </div>
                </button>
            </div>
        </nav>
    );
});

export default Sidebar;
