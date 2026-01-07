import React from 'react';
import './InputArea.css'; // We'll put styles here

const COMMANDS = [
    { cmd: '/image', desc: 'Generate an image', usage: '/image <prompt>' },
    { cmd: '/clear', desc: 'Clear conversation', usage: '/clear' },
    { cmd: '/reset', desc: 'Reset session', usage: '/reset' },
    { cmd: '/library', desc: 'Open Prompt Library', usage: '/library' },
    { cmd: '/help', desc: 'Show help', usage: '/help' }
];

const SlashMenu = ({ input, onSelect }) => {
    // Filter commands based on input, but ignore the '/' itself
    const query = input.toLowerCase();

    // Exact match or partial match
    // If input is just "/", show all
    const matches = COMMANDS.filter(c => c.cmd.startsWith(query));

    if (matches.length === 0) return null;

    return (
        <div className="slash-menu">
            {matches.map((c, i) => (
                <div
                    key={c.cmd}
                    className={`slash-item ${i === 0 ? 'selected' : ''}`} // Auto-highlight first
                    onClick={() => onSelect(c)}
                >
                    <span className="slash-cmd">{c.cmd}</span>
                    <span className="slash-desc">{c.desc}</span>
                </div>
            ))}
        </div>
    );
};

export default SlashMenu;
