// Helper to get buffer from chunk
const readChunk = async (reader) => {
    const { value, done } = await reader.read();
    return { value, done };
};

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const getGeminiStream = async (history, onChunk, signal) => {
    // We no longer need the API key here
    let modelName = localStorage.getItem('gemini_model_name');
    if (!modelName || modelName === 'gemini-1.5-flash') {
        modelName = 'gemini-2.0-flash';
        localStorage.setItem('gemini_model_name', modelName);
    }
    const systemInstruction = localStorage.getItem('gemini_system_instruction');
    const useGrounding = localStorage.getItem('gemini_use_grounding') === 'true';
    const useCodeExecution = localStorage.getItem('gemini_use_code_execution') === 'true';

    // Format history for backend
    // Backend expects { role, parts } and will handle SDK-specific formatting if needed
    // But our current history format is custom UI format.
    const formattedHistory = history.map(msg => {
        const parts = [];
        if (msg.text) parts.push({ text: msg.text });
        if (msg.attachment) {
            parts.push({
                inlineData: {
                    mimeType: msg.attachment.mimeType,
                    data: msg.attachment.data
                }
            });
        }
        if (parts.length === 0) parts.push({ text: " " });
        return {
            role: msg.isUser ? "user" : "model",
            parts: parts
        };
    });

    try {
        const response = await fetch(`${BASE_URL}/api/chat/stream`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                history: formattedHistory,
                modelName,
                modelName,
                systemInstruction: (systemInstruction || "You are a helpful AI assistant.") + "\n\nCAPABILITIES:\n- You can search the web using tools if available.\n- You can generate charts. To render a chart, output a code block with language 'chart' containing JSON with this schema: { type: 'bar'|'line'|'pie', data: [{name: string, value: number}, ...], xKey: 'name', dataKey: 'value' }.",
                useGrounding,
                useCodeExecution
            }),
            signal
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw errorData.error || new Error(`Server Error: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let fullText = "";
        while (true) {
            const { value, done } = await readChunk(reader);
            if (done) break;
            const chunkText = decoder.decode(value, { stream: true });
            if (chunkText) {
                onChunk(chunkText);
                fullText += chunkText;
            }
        }

        return {
            text: () => fullText
        };

    } catch (error) {
        console.error("Chat stream error:", error);
        throw error;
    }
};

export const getGeminiResponse = async (history) => {
    let fullText = "";
    await getGeminiStream(history, (chunk) => {
        fullText += chunk;
    });
    return fullText;
};

export const getAvailableModels = async (apiKey) => {
    // apiKey arg is now ignored or optional since backend handles it
    try {
        const response = await fetch(`${BASE_URL}/api/models`);
        if (!response.ok) return [];
        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error("Failed to list models:", error);
        return [];
    }
};

export const generateImage = async (prompt) => {
    try {
        const response = await fetch(`${BASE_URL}/api/generate/image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw errorData.error || new Error(`Image API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.image; // returns base64 string
    } catch (error) {
        console.error("Image generation failed:", error);
        throw error;
    }
};
