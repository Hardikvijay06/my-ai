import React, { useState, useEffect } from 'react';
import { getAvailableModels } from '../services/ai';
import './SettingsModal.css';

const SettingsModal = ({ isOpen, onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('gemini-1.5-flash');
    const [systemInstruction, setSystemInstruction] = useState('');
    const [autoSpeak, setAutoSpeak] = useState(false);
    const [useGrounding, setUseGrounding] = useState(false);
    const [useCodeExecution, setUseCodeExecution] = useState(false);
    const [availableModels, setAvailableModels] = useState([]);
    const [loadingModels, setLoadingModels] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Load saved settings
            const savedKey = localStorage.getItem('gemini_api_key') || '';
            setApiKey(savedKey);

            setModel(localStorage.getItem('gemini_model_name') || 'gemini-1.5-flash');
            setSystemInstruction(localStorage.getItem('gemini_system_instruction') || '');
            setAutoSpeak(localStorage.getItem('ai_auto_speak') === 'true');
            setUseGrounding(localStorage.getItem('gemini_use_grounding') === 'true');
            setUseCodeExecution(localStorage.getItem('gemini_use_code_execution') === 'true');
        }
    }, [isOpen]);

    useEffect(() => {
        const fetchModels = async () => {
            if (apiKey && isOpen) {
                setLoadingModels(true);
                try {
                    const models = await getAvailableModels(apiKey);
                    // Filter for generating content models
                    let chatModels = models.filter(m =>
                        m.name.includes('gemini') &&
                        m.supportedGenerationMethods.includes('generateContent')
                    );

                    // Manually ensure gemini-2.0-flash-thinking-exp-01-21 is present
                    const thinkingModelName = 'models/gemini-2.0-flash-thinking-exp-01-21';
                    if (!chatModels.find(m => m.name === thinkingModelName)) {
                        chatModels.unshift({
                            name: thinkingModelName,
                            displayName: 'Gemini 2.0 Flash Thinking Experimental'
                        });
                    }

                    // Sort to put newer models first (simple heuristic)
                    chatModels.sort((a, b) => b.name.localeCompare(a.name));

                    setAvailableModels(chatModels);
                } catch (error) {
                    console.error("Failed to fetch models", error);
                    // Fallback list
                    setAvailableModels([
                        { name: 'models/gemini-2.0-flash-thinking-exp-01-21', displayName: 'Gemini 2.0 Flash Thinking Experimental' },
                        { name: 'models/gemini-1.5-flash', displayName: 'Gemini 1.5 Flash' },
                        { name: 'models/gemini-1.5-pro', displayName: 'Gemini 1.5 Pro' },
                    ]);
                } finally {
                    setLoadingModels(false);
                }
            }
        };

        if (isOpen && apiKey) {
            fetchModels();
        }
    }, [isOpen, apiKey]);

    useEffect(() => {
        if (availableModels.length > 0 && !loadingModels) {
            const currentModelDetails = availableModels.find(m => m.name === model);
            // If currently selected model is NOT in the list, or is the deprecated 1219 model
            if (!currentModelDetails || model.includes('1219')) {
                const firstModel = availableModels[0].name;
                setModel(firstModel);
                localStorage.setItem('gemini_model_name', firstModel);
            }
        }
    }, [availableModels, loadingModels, model]);

    const handleSave = () => {
        localStorage.setItem('gemini_api_key', apiKey);
        localStorage.setItem('gemini_model_name', model);
        localStorage.setItem('gemini_system_instruction', systemInstruction);
        localStorage.setItem('ai_auto_speak', autoSpeak);
        localStorage.setItem('gemini_use_grounding', useGrounding);
        localStorage.setItem('gemini_use_code_execution', useCodeExecution);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Settings</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>Google Gemini API Key</label>
                        <div className="info-text">
                            ✅ <small>API Key is managed exclusively by the secure backend server.</small>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Model</label>
                        {loadingModels ? (
                            <div className="loading-spinner-small">Loading models...</div>
                        ) : (
                            <select value={model} onChange={(e) => setModel(e.target.value)}>
                                {availableModels.map(m => (
                                    <option key={m.name} value={m.name}>
                                        {m.displayName || m.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="form-group">
                        <label>System Instructions (Persona)</label>
                        <textarea
                            value={systemInstruction}
                            onChange={(e) => setSystemInstruction(e.target.value)}
                            placeholder="e.g., You are a helpful coding assistant who loves Python."
                            rows="4"
                        />
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={autoSpeak}
                                onChange={(e) => setAutoSpeak(e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </label>
                        <span>Auto-speak AI responses</span>
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={useCodeExecution}
                                onChange={(e) => setUseCodeExecution(e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </label>
                        <span>Use Code Execution (Gemini 2.0 Only)</span>
                        <small className="setting-desc">Allows the model to run Python code for math and reasoning.</small>
                    </div>

                    <div className="form-group checkbox-group">
                        <label className="switch">
                            <input
                                type="checkbox"
                                checked={useGrounding}
                                onChange={(e) => setUseGrounding(e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </label>
                        <span>Enable Google Search Grounding 🌍</span>
                        <small className="setting-desc">Allows the model to search the web for real-time info.</small>
                    </div>

                    <div className="form-group">
                        <label>Model</label>
                        {loadingModels ? (
                            <div className="loading-spinner-small">Loading models...</div>
                        ) : (
                            <select value={model} onChange={(e) => setModel(e.target.value)}>
                                {availableModels.map(m => (
                                    <option key={m.name} value={m.name}>
                                        {m.displayName || m.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                    <button className="save-btn" onClick={handleSave}>Save Settings</button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
