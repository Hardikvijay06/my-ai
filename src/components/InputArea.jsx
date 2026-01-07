import React, { useState } from 'react';
import PromptLibrary from './PromptLibrary';
import SlashMenu from './SlashMenu';
import './InputArea.css';

const InputArea = ({ onSend, onClear, onFocusSearch }) => {
    const [input, setInput] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [showPromptLib, setShowPromptLib] = useState(false);
    const [isListening, setIsListening] = useState(false);

    // Command Handling
    const isCommandMode = input.startsWith('/');
    // Check if we are still typing the command part (no space yet)
    const showSlashMenu = isCommandMode && !input.includes(' ');

    const handleCommandSelect = (commandItem) => {
        // specialized actions for some commands
        if (commandItem.cmd === '/library') {
            setShowPromptLib(true);
            setInput('');
        } else if (commandItem.cmd === '/clear') {
            onClear();
            setInput('');
        } else if (commandItem.cmd === '/help') {
            // Just let it show help
            setInput('/help'); // User will hit enter
        } else {
            // Autocomplete
            setInput(`${commandItem.cmd} `);
            // focus back? (React does this usually)
        }
    };

    const handleSend = async () => {
        if (input.trim() === '/library') {
            setShowPromptLib(true);
            setInput('');
            return;
        }

        // Let main ChatArea or existing logic handle /image, /clear etc if we just send text
        // But we want to intercept /clear here if possible for immediate UI feedback, 
        // though prop onClear is available.
        if (input.trim() === '/clear') {
            onClear();
            setInput('');
            return;
        }

        if ((input.trim() || selectedFile) && !isProcessing) {
            let finalInput = input;
            let fileAttachment = null;

            if (selectedFile) {
                if (selectedFile.isText) {
                    finalInput = `[File: ${selectedFile.name}]:\n\`\`\`${selectedFile.extension}\n${selectedFile.content}\n\`\`\`\n\n${input}`;
                } else {
                    fileAttachment = {
                        mimeType: selectedFile.mimeType,
                        data: selectedFile.data
                    };
                }
            }

            onSend(finalInput, fileAttachment);

            setInput('');
            setSelectedFile(null);
        }
    };

    const handleKeyDown = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === '/') {
            e.preventDefault();
            setShowPromptLib(true);
            return;
        }
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            onFocusSearch && onFocusSearch();
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // If slash menu is open and we have a selection... 
            // For now simpler: just send. SlashMenu click handles selection.
            handleSend();
        }
    };

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    // ... (Keep existing file/mic handlers) ...
    const handleMicClick = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Speech recognition is not supported.");
            return;
        }
        if (isListening) return;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(prev => (prev ? prev + " " + transcript : transcript));
        };
        recognition.start();
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        processFile(file);
    };

    // Drag and drop handlers
    const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    const processFile = async (file) => {
        setIsProcessing(true);
        try {
            const isImage = file.type.startsWith('image/');
            const isPdf = file.type === 'application/pdf';
            // Simple text check
            const isText = file.type.startsWith('text/') ||
                ['js', 'jsx', 'ts', 'tsx', 'py', 'html', 'css', 'json', 'md', 'txt'].some(ext => file.name.endsWith('.' + ext));

            if (isImage || isPdf) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setSelectedFile({
                        name: file.name,
                        mimeType: file.type,
                        data: reader.result.split(',')[1],
                        preview: isImage ? reader.result : null,
                        isText: false,
                        type: isImage ? 'image' : 'pdf'
                    });
                };
                reader.readAsDataURL(file);
            } else if (isText) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setSelectedFile({
                        name: file.name,
                        content: reader.result,
                        isText: true,
                        extension: file.name.split('.').pop()
                    });
                };
                reader.readAsText(file);
            } else {
                alert("Unsupported file type.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSelectPrompt = (promptText) => {
        setInput(promptText);
        setShowPromptLib(false);
    };

    return (
        <div
            className={`input-container ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            role="form"
            aria-label="Message Input Form"
        >
            {/* Slash Menu Popup */}
            {showSlashMenu && (
                <div className="slash-menu-wrapper">
                    <SlashMenu input={input} onSelect={handleCommandSelect} />
                </div>
            )}

            {/* Preview Area */}
            {selectedFile && (
                <div className="image-preview-container">
                    <div className="image-preview">
                        {selectedFile.preview ? (
                            <img src={selectedFile.preview} alt={`Preview of ${selectedFile.name}`} />
                        ) : (
                            <div className="pdf-preview">
                                {selectedFile.isText ? '📝' : '📄'} {selectedFile.name}
                            </div>
                        )}
                        <button className="remove-image-btn" onClick={() => setSelectedFile(null)} aria-label="Remove attachment">×</button>
                    </div>
                </div>
            )}

            <PromptLibrary
                isOpen={showPromptLib}
                onClose={() => setShowPromptLib(false)}
                onSelectPrompt={handleSelectPrompt}
            />

            <div className="input-wrapper glass">
                <button
                    className={`mic-btn ${isListening ? 'listening' : ''}`}
                    onClick={handleMicClick}
                    title="Voice Input"
                    aria-label="Voice Input"
                >
                    🎤
                </button>
                <button
                    className="mic-btn"
                    onClick={() => setShowPromptLib(true)}
                    title="Prompt Library"
                    aria-label="Open Prompt Library"
                    style={{ marginLeft: '5px' }}
                >
                    📖
                </button>
                <label className="attach-btn" title="Attach File" aria-label="Attach File">
                    <input
                        type="file"
                        onChange={handleFileSelect}
                        disabled={isProcessing}
                        hidden
                        aria-label="Upload file"
                    />
                    📎
                </label>
                <input
                    type="text"
                    className="chat-input"
                    placeholder="Type a message or /command..."
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    aria-label="Type a message"
                />
                <button
                    className="send-btn"
                    onClick={handleSend}
                    disabled={(!input.trim() && !selectedFile) || isProcessing}
                    aria-label="Send Message"
                >
                    ➜
                </button>
            </div>
            <div className="input-footer">
                AI can make mistakes. Please verify important information.
            </div>
        </div>
    );
};

export default InputArea;

