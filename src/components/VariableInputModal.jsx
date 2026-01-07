import React, { useState, useEffect } from 'react';
import './PromptLibrary.css'; // Reusing styles for consistency

const VariableInputModal = ({ isOpen, onClose, onSubmit, variables, promptTitle }) => {
    const [values, setValues] = useState({});

    useEffect(() => {
        if (isOpen && variables.length > 0) {
            const initial = {};
            variables.forEach(v => initial[v] = '');
            setValues(initial);
        }
    }, [isOpen, variables]);

    const handleChange = (variable, value) => {
        setValues(prev => ({ ...prev, [variable]: value }));
    };

    const handleSubmit = () => {
        // Validate all filled? Optional for now.
        onSubmit(values);
        setValues({});
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ zIndex: 1100 }}> {/* Higher than library */}
            <div className="modal-content variable-modal">
                <div className="modal-header">
                    <h3>Fill Variables for "{promptTitle}"</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <p className="helper-text">This prompt has placeholders. Please fill them in:</p>
                    <div className="variables-list">
                        {variables.map(v => (
                            <div key={v} className="variable-field">
                                <label>{v}:</label>
                                <input
                                    type="text"
                                    value={values[v] || ''}
                                    onChange={(e) => handleChange(v, e.target.value)}
                                    placeholder={`Enter value for ${v}...`}
                                    autoFocus={variables[0] === v}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="modal-actions">
                        <button className="secondary-btn" onClick={onClose}>Cancel</button>
                        <button className="primary-btn" onClick={handleSubmit}>Insert Prompt</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VariableInputModal;
