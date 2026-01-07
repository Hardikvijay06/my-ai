import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './Message.css';

const CodeBlock = ({ language, value, onOpenArtifact }) => {
    const [copied, setCopied] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isPreviewable = ['html', 'javascript', 'js'].includes(language?.toLowerCase());

    const previewContent = language === 'javascript' || language === 'js'
        ? `<html><body><script>${value}</script></body></html>`
        : value;

    return (
        <div className="code-container">
            <div className="code-header">
                <span className="code-lang">{language}</span>
                <div className="code-actions">
                    {isPreviewable && (
                        <button
                            className={`preview-toggle-btn ${showPreview ? 'active' : ''}`}
                            onClick={() => setShowPreview(!showPreview)}
                        >
                            {showPreview ? 'Code' : 'Preview'}
                        </button>
                    )}
                    {(language === 'html' || language === 'javascript' || language === 'js' || language === 'jsx') && (
                        <button
                            className="artifact-btn"
                            onClick={() => onOpenArtifact && onOpenArtifact(value, language)}
                            title="Open in Side Panel"
                        >
                            ↗️ Open
                        </button>
                    )}
                    <button onClick={handleCopy} className="copy-btn">
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>
            </div>
            {showPreview && isPreviewable ? (
                <div className="code-preview">
                    <iframe
                        title="Code Preview"
                        srcDoc={previewContent}
                        sandbox="allow-scripts"
                        style={{ width: '100%', border: 'none', background: 'white', height: '300px' }}
                    />
                </div>
            ) : (
                <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={language}
                    PreTag="div"
                    className="code-highlighter"
                >
                    {value}
                </SyntaxHighlighter>
            )}
        </div>
    );
};

import mermaid from 'mermaid';
import { useEffect, useRef } from 'react';

// Initialize mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    securityLevel: 'loose',
});

import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const ChartBlock = ({ code }) => {
    try {
        const data = JSON.parse(code);
        const type = data.type || 'bar';
        const chartData = data.data || [];
        const xKey = data.xKey || 'name';
        const dataKey = data.dataKey || 'value';

        if (!chartData.length) return <div className="error">No data for chart</div>;

        return (
            <div style={{ width: '100%', height: 300, marginTop: '10px', marginBottom: '10px' }}>
                <ResponsiveContainer>
                    {type === 'line' ? (
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={xKey} stroke="#ccc" />
                            <YAxis stroke="#ccc" />
                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                            <Legend />
                            <Line type="monotone" dataKey={dataKey} stroke="#8884d8" strokeWidth={2} />
                        </LineChart>
                    ) : type === 'pie' ? (
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey={dataKey}
                                nameKey={xKey}
                                label
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                            <Legend />
                        </PieChart>
                    ) : (
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey={xKey} stroke="#ccc" />
                            <YAxis stroke="#ccc" />
                            <Tooltip contentStyle={{ backgroundColor: '#333', border: 'none' }} />
                            <Legend />
                            <Bar dataKey={dataKey} fill="#82ca9d" />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        );
    } catch (e) {
        return <div className="error">Invalid Chart Data: {e.message}</div>;
    }
};

const MermaidBlock = ({ code }) => {
    const ref = useRef(null);
    const [svg, setSvg] = useState('');

    useEffect(() => {
        if (code && ref.current) {
            const render = async () => {
                try {
                    const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
                    const { svg } = await mermaid.render(id, code);
                    setSvg(svg);
                } catch (error) {
                    console.error("Mermaid failed to render:", error);
                    setSvg(`<div class="error">Failed to render diagram</div>`);
                }
            };
            render();
        }
    }, [code]);

    return (
        <div className="mermaid-container" ref={ref} dangerouslySetInnerHTML={{ __html: svg }} />
    );
};

// ... (Existing CodeBlock component remains the same)

const Message = ({ text, isUser, animate, attachment, showRegenerate, onRegenerate, onOpenArtifact }) => {
    // ... (Existing Message component logic matches existing)
    const [isSpeaking, setIsSpeaking] = useState(false);

    const handleSpeak = () => {
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => setIsSpeaking(false);
        // Select a good voice if available (optional enhancement)
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };
    return (
        <article className={`message-wrapper ${isUser ? 'user' : 'ai'} ${animate ? 'fade-in' : ''}`}>
            {!isUser && (
                <div className="message-avatar ai-avatar" aria-hidden="true">
                    <span>AI</span>
                </div>
            )}
            <div className="message-bubble">
                {attachment && (
                    <img
                        src={attachment.preview}
                        alt="User upload"
                        className="message-image"
                    />
                )}
                {isUser ? (
                    <div className="message-text">{text}</div>
                ) : (
                    <>
                        <ReactMarkdown
                            components={{
                                code({ node, inline, className, children, ...props }) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const lang = match ? match[1] : '';

                                    if (!inline && lang === 'mermaid') {
                                        return <MermaidBlock code={String(children).replace(/\n$/, '')} />;
                                    }
                                    if (!inline && lang === 'chart') {
                                        return <ChartBlock code={String(children).replace(/\n$/, '')} />;
                                    }

                                    return !inline && match ? (
                                        <CodeBlock
                                            language={lang}
                                            value={String(children).replace(/\n$/, '')}
                                            onOpenArtifact={onOpenArtifact}
                                        />
                                    ) : (
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    );
                                }
                            }}
                        >
                            {text}
                        </ReactMarkdown>
                        <div className="message-actions">
                            <button
                                className="icon-btn"
                                onClick={handleSpeak}
                                title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
                                aria-label={isSpeaking ? "Stop Speaking" : "Read Aloud"}
                            >
                                {isSpeaking ? '🔇' : '🔊'}
                            </button>
                            {showRegenerate && (
                                <button
                                    className="icon-btn regenerate-btn"
                                    onClick={onRegenerate}
                                    title="Regenerate Response"
                                    aria-label="Regenerate Response"
                                >
                                    🔄
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
            {isUser && (
                <div className="message-avatar user-avatar" aria-hidden="true">
                    <span>U</span>
                </div>
            )}
        </article>
    );
};

export default Message;
