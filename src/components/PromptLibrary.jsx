import React, { useState, useEffect } from 'react';
import { loadPrompts, savePrompts, createPrompt, parseVariables } from '../services/promptStorage';
import VariableInputModal from './VariableInputModal';
import './PromptLibrary.css';

const PromptLibrary = ({ isOpen, onClose, onSelectPrompt }) => {
    const [prompts, setPrompts] = useState([]);
    const [view, setView] = useState('list'); // 'list' | 'create'

    // Create Prompt State
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newTags, setNewTags] = useState(''); // Comma separated string

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTag, setSelectedTag] = useState(null);

    // Variable Injection State
    const [pendingPrompt, setPendingPrompt] = useState(null); // The prompt being activated
    const [variableModalOpen, setVariableModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setPrompts(loadPrompts());
            setView('list');
            setSearchTerm('');
            setSelectedTag(null);
            setPendingPrompt(null);
            setVariableModalOpen(false);
        }
    }, [isOpen]);

    const handleSave = () => {
        if (!newTitle.trim() || !newContent.trim()) return;

        const tagsList = newTags.split(',').map(t => t.trim()).filter(Boolean);
        const newPrompt = createPrompt(newTitle, newContent, tagsList);

        const updated = [...prompts, newPrompt];
        setPrompts(updated);
        savePrompts(updated);

        // Reset form
        setNewTitle('');
        setNewContent('');
        setNewTags('');
        setView('list');
    };

    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (confirm("Delete this prompt?")) {
            const updated = prompts.filter(p => p.id !== id);
            setPrompts(updated);
            savePrompts(updated);
        }
    };

    const initiateSelectPrompt = (prompt) => {
        const variables = parseVariables(prompt.content);
        if (variables.length > 0) {
            setPendingPrompt({ ...prompt, variables });
            setVariableModalOpen(true);
        } else {
            onSelectPrompt(prompt.content);
        }
    };

    const handleVariableSubmit = (values) => {
        let content = pendingPrompt.content;
        Object.entries(values).forEach(([key, value]) => {
            content = content.replaceAll(`{{${key}}}`, value);
        });
        setVariableModalOpen(false);
        setPendingPrompt(null);
        onSelectPrompt(content);
    };

    // Filter Logic
    const availableTags = [...new Set(prompts.flatMap(p => p.tags || []))].sort();

    const filteredPrompts = prompts.filter(p => {
        const matchesSearch = (p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.content.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesTag = selectedTag ? (p.tags && p.tags.includes(selectedTag)) : true;
        return matchesSearch && matchesTag;
    });

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content prompt-library-modal">
                <div className="modal-header">
                    <h2>Prompt Library</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {view === 'list' ? (
                        <div className="prompt-list-view">
                            <div className="library-controls">
                                <div className="search-bar">
                                    <span className="search-icon">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Search prompts..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button className="create-prompt-btn" onClick={() => setView('create')}>
                                    + New
                                </button>
                            </div>

                            {availableTags.length > 0 && (
                                <div className="tags-filter">
                                    <span
                                        className={`tag-chip ${selectedTag === null ? 'active' : ''}`}
                                        onClick={() => setSelectedTag(null)}
                                    >
                                        All
                                    </span>
                                    {availableTags.map(tag => (
                                        <span
                                            key={tag}
                                            className={`tag-chip ${selectedTag === tag ? 'active' : ''}`}
                                            onClick={() => setSelectedTag(tag)}
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {filteredPrompts.length === 0 ? (
                                <div className="empty-state">
                                    {searchTerm || selectedTag ? "No matches found." : "No saved prompts yet."}
                                </div>
                            ) : (
                                <div className="prompt-grid">
                                    {filteredPrompts.map(p => (
                                        <div key={p.id} className="prompt-card" onClick={() => initiateSelectPrompt(p)}>
                                            <div className="card-header">
                                                <div className="prompt-title">{p.title}</div>
                                                <button onClick={(e) => handleDelete(e, p.id)} className="card-delete-btn">×</button>
                                            </div>
                                            <div className="prompt-preview">{p.content}</div>
                                            {(p.tags && p.tags.length > 0) && (
                                                <div className="card-tags">
                                                    {p.tags.map(t => <span key={t}>#{t}</span>)}
                                                </div>
                                            )}
                                            {(p.variables && p.variables.length > 0) && (
                                                <div className="var-badge">{p.variables.length} vars</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="create-prompt-view">
                            <div className="form-group">
                                <label>Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Code Refactor"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="prompt-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Tags (comma separated)</label>
                                <input
                                    type="text"
                                    placeholder="coding, python, debug"
                                    value={newTags}
                                    onChange={(e) => setNewTags(e.target.value)}
                                    className="prompt-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Prompt Content <span className="hint">(Use {'{{var}}'} for variables)</span></label>
                                <textarea
                                    placeholder="Write a function to {{action}} in {{language}}..."
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    rows="8"
                                    className="prompt-textarea"
                                />
                            </div>
                            <div className="create-actions">
                                <button onClick={() => setView('list')} className="cancel-btn">Cancel</button>
                                <button onClick={handleSave} className="save-btn">Save Prompt</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Nested Modal for Variables */}
            <VariableInputModal
                isOpen={variableModalOpen}
                onClose={() => setVariableModalOpen(false)}
                onSubmit={handleVariableSubmit}
                variables={pendingPrompt?.variables || []}
                promptTitle={pendingPrompt?.title}
            />
        </div>
    );
};

export default PromptLibrary;
