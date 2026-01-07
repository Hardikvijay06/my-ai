const STORAGE_KEY = 'ai_saved_prompts';

export const loadPrompts = () => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error("Failed to load prompts", e);
        return [];
    }
};

export const savePrompts = (prompts) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
    } catch (e) {
        console.error("Failed to save prompts", e);
    }
};

export const parseVariables = (content) => {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = [...content.matchAll(regex)];
    return [...new Set(matches.map(m => m[1].trim()))];
};

export const createPrompt = (title, content, tags = []) => {
    return {
        id: Date.now().toString(),
        title,
        content,
        tags,
        variables: parseVariables(content),
        createdAt: Date.now()
    };
};
