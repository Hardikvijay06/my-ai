import React, { useState, useEffect, useRef } from 'react';
import './ArtifactPanel.css';

const ArtifactPanel = ({ isOpen, onClose, code, language }) => {
    const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'code'
    const [iframeContent, setIframeContent] = useState('');

    useEffect(() => {
        if (code && (language === 'html' || language === 'javascript' || language === 'js')) {
            // Basic sandboxing wrapper
            const content = `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: sans-serif; padding: 20px; color: #333; background: #fff; }
                    </style>
                </head>
                <body>
                    ${language === 'html' ? code : `<script>${code}</script>`}
                </body>
                </html>
            `;
            setIframeContent(content);
        } else {
            setIframeContent('');
        }
    }, [code, language]);

    if (!isOpen) return null;

    return (
        <div className={`artifact-panel ${isOpen ? 'open' : ''}`}>
            <div className="artifact-header">
                <div className="tabs">
                    <button
                        className={`tab-btn ${activeTab === 'preview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('preview')}
                    >
                        Preview
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`}
                        onClick={() => setActiveTab('code')}
                    >
                        Code
                    </button>
                </div>
                <button className="close-btn" onClick={onClose} title="Close Panel">×</button>
            </div>

            <div className="artifact-content">
                {activeTab === 'preview' ? (
                    <div className="preview-container">
                        {iframeContent ? (
                            <iframe
                                title="Artifact Preview"
                                srcDoc={iframeContent}
                                sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
                                className="artifact-iframe"
                            />
                        ) : (
                            <div className="empty-state">
                                No previewable content available. Use HTML or JS.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="code-view">
                        <pre><code>{code}</code></pre>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ArtifactPanel;
