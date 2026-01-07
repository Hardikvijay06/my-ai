import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import InputArea from './InputArea';
import SettingsModal from './SettingsModal';
import ArtifactPanel from './ArtifactPanel';
import { getGeminiStream, generateImage } from '../services/ai';
import './ChatArea.css';

const WELCOME_MSG = {
    id: 'welcome',
    text: "Hello! I'm your AI assistant. I'm connected to Google Gemini. How can I help you?",
    isUser: false
};

const ChatArea = ({ messages, onUpdateMessages, onFocusSearch }) => {
    // Props: messages, onUpdateMessages(newMessages)

    const [isTyping, setIsTyping] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Artifact Panel State
    const [showArtifact, setShowArtifact] = useState(false);
    const [artifactCode, setArtifactCode] = useState('');
    const [artifactLang, setArtifactLang] = useState('');

    const messagesEndRef = useRef(null);
    const abortControllerRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // console.log("[ChatArea] Messages updated:", messages.length);
        scrollToBottom();
    }, [messages, isTyping]);

    // Local storage persistence is now handled by App.jsx

    const handleClearChat = () => {
        if (confirm("Are you sure you want to clear this conversation?")) {
            onUpdateMessages([WELCOME_MSG]);
        }
    };

    // Wrapper to pass updates directly to parent
    const setMessages = (update) => {
        onUpdateMessages(update);
    };

    const handleExportChat = (format = 'json') => {
        let dataStr;
        let fileName = 'chat_history';

        if (format === 'markdown') {
            const mdContent = messages.map(m => {
                const role = m.isUser ? "User" : "AI";
                return `**${role}**: ${m.text}\n\n`;
            }).join('---\n\n');
            dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(mdContent);
            fileName += '.md';
        } else {
            dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(messages, null, 2));
            fileName += '.json';
        }

        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", fileName);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const speakMessage = (text) => {
        const shouldSpeak = localStorage.getItem('ai_auto_speak') === 'true';
        if (shouldSpeak && text) {
            // Cancel any current speech to avoid overlap
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsTyping(false);
        }
    };

    const handleOpenArtifact = (code, language) => {
        setArtifactCode(code);
        setArtifactLang(language);
        setShowArtifact(true);
    };

    const triggerGeneration = async (currentHistory) => {
        setIsTyping(true);

        // Cancel previous
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        const aiMessageId = Date.now() + 1;

        // Optimistically add AI placeholder
        setMessages([...currentHistory, {
            id: aiMessageId,
            text: "",
            isUser: false,
            animate: true
        }]);

        try {
            const lastMsg = currentHistory[currentHistory.length - 1];
            const text = lastMsg.text || "";

            // Check for image command (simple check on last user message)
            if (text.trim().toLowerCase().startsWith('/image') || text.trim().toLowerCase().startsWith('/imagine')) {
                const prompt = text.replace(/^\/image\s*|^\/imagine\s*/i, '');

                setMessages(prev => prev.map(msg =>
                    msg.id === aiMessageId ? { ...msg, text: "🎨 Generating image..." } : msg
                ));

                const base64Image = await generateImage(prompt);

                setMessages(prev => prev.map(msg =>
                    msg.id === aiMessageId ? {
                        ...msg,
                        text: `Here is your image for: "${prompt}"`,
                        attachment: { preview: `data:image/png;base64,${base64Image}`, mimeType: 'image/png' }
                    } : msg
                ));
            } else {
                // Normal generation
                const response = await getGeminiStream(currentHistory, (chunk) => {
                    setMessages(prev => prev.map(msg =>
                        msg.id === aiMessageId
                            ? { ...msg, text: msg.text + chunk }
                            : msg
                    ));
                }, abortController.signal);

                const responseText = response.text();
                speakMessage(responseText);
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log("Generation stopped");
                setMessages(prev => prev.map(msg =>
                    msg.id === aiMessageId ? { ...msg, text: msg.text + " [Stopped]" } : msg
                ));
            } else {
                console.error(error);
                setMessages(prev => prev.map(msg =>
                    msg.id === aiMessageId ? { ...msg, text: `Error: ${error.message}`, isError: true } : msg
                ));
            }
        } finally {
            setIsTyping(false);
            abortControllerRef.current = null;
        }
    };

    const handleSend = async (text, image) => {
        const newMessage = {
            id: Date.now(),
            text,
            isUser: true,
            attachment: image
        };
        const updatedHistory = [...messages, newMessage];
        setMessages(updatedHistory); // Optimistic UI for user message

        // Trigger AI
        triggerGeneration(updatedHistory);
    };

    const handleRegenerate = () => {
        const lastUserIndex = messages.findLastIndex(m => m.isUser);
        if (lastUserIndex === -1) return;

        // Revert to state including that user message, dropping subsequent AI response
        const newHistory = messages.slice(0, lastUserIndex + 1);
        setMessages(newHistory);

        // Trigger AI again with this history
        triggerGeneration(newHistory);
    };


    return (
        <main className="chat-area" role="main">
            <header className="chat-header glass">
                <div className="header-controls">
                    <button className="icon-btn settings-btn" onClick={() => setShowSettings(true)} aria-label="Settings">
                        ⚙️
                    </button>
                    <button className="icon-btn export-btn" onClick={() => handleExportChat('markdown')} aria-label="Export as Markdown">
                        ⬇️ MD
                    </button>
                    <button className="icon-btn export-btn" onClick={() => handleExportChat('json')} aria-label="Export as JSON">
                        💾
                    </button>
                    <button className="clear-btn" onClick={handleClearChat} aria-label="Clear Chat History">
                        Clear
                    </button>
                </div>
            </header>
            <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

            <ArtifactPanel
                isOpen={showArtifact}
                onClose={() => setShowArtifact(false)}
                code={artifactCode}
                language={artifactLang}
            />

            <div
                className={`messages-container ${showArtifact ? 'artifact-open' : ''}`}
                role="log"
                aria-live="polite"
                aria-label="Chat history"
                tabIndex={0}
            >
                {messages.map((msg, index) => (
                    <Message
                        key={msg.id}
                        text={msg.text}
                        isUser={msg.isUser}
                        animate={msg.animate}
                        attachment={msg.attachment}
                        showRegenerate={!isTyping && !msg.isUser && index === messages.length - 1}
                        onRegenerate={handleRegenerate}
                        onOpenArtifact={handleOpenArtifact}
                    />
                ))}
                {isTyping && (
                    <div className="typing-indicator" aria-label="AI is typing">
                        <span>●</span><span>●</span><span>●</span>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {isTyping && (
                <div className="stop-btn-container">
                    <button className="stop-btn glass" onClick={handleStop} aria-label="Stop generating">
                        ⏹ Stop Generating
                    </button>
                </div>
            )}

            <div className="input-area-wrapper glass">
                <InputArea
                    onSend={handleSend}
                    onClear={handleClearChat}
                    onFocusSearch={onFocusSearch}
                />
            </div>
        </main>
    );
};

export default ChatArea;
