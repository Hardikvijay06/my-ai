export const STORAGE_KEY = 'chat_sessions';

// Shape of a session:
// {
//   id: string,
//   title: string,
//   messages: Array,
//   createdAt: number,
//   updatedAt: number
// }

export const loadSessions = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error("Failed to load sessions", e);
        return [];
    }
};

export const saveSessions = (sessions) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
        console.error("Failed to save sessions", e);
    }
};

export const createNewSession = (firstMessage = null) => {
    const session = {
        id: Date.now().toString(),
        title: 'New Chat',
        messages: firstMessage ? [firstMessage] : [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    return session;
};

// Helper: Migrate legacy single-chat history if exists
export const migrateLegacyHistory = () => {
    const legacyKey = 'chat_history';
    const legacyHistory = localStorage.getItem(legacyKey);

    if (legacyHistory) {
        const sessions = loadSessions();
        try {
            const messages = JSON.parse(legacyHistory);
            // Only migrate if it's not just the welcome message
            if (messages.length > 1 || (messages.length === 1 && messages[0].id !== 'welcome')) {
                const migratedSession = {
                    id: 'legacy-' + Date.now(),
                    title: 'Previous Chat',
                    messages: messages,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                sessions.unshift(migratedSession);
                saveSessions(sessions);
            }
            localStorage.removeItem(legacyKey); // Clean up
        } catch (e) {
            console.error("Migration failed", e);
        }
    }
};
