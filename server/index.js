const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');

// Load environment variables from the root .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json()); // For parsing application/json

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
    console.error("ERROR: GEMINI_API_KEY is not set in .env file");
}
const genAI = new GoogleGenerativeAI(apiKey);

// Helper to extract clean error info
const parseGeminiError = (error) => {
    const msg = error.message || error.toString();
    if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('limit')) {
        let waitSeconds = null;
        const match = msg.match(/retry in ([0-9.]+)s/);
        if (match && match[1]) waitSeconds = Math.ceil(parseFloat(match[1]));
        return { type: 'RATE_LIMIT', message: "You've hit the free tier rate limit.", waitSeconds };
    }
    return { type: 'General', message: msg };
};

// --- Routes ---

// 1. List Models
app.get('/api/models', async (req, res) => {
    try {
        // We can't list models via the SDK easily without a key in some versions, 
        // but let's try the simple fetch approach if SDK doesn't expose it handy, 
        // OR just rely on hardcoded list if needed. 
        // Actually, SDK has getGenerativeModel but listing might need direct HTTP or specific manager.
        // Let's use the direct HTTP call for listing as done in the client previously, 
        // but properly proxied.

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);
        const data = await response.json();
        res.json(data.models || []);
    } catch (error) {
        console.error("Error listing models:", error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Chat Streaming
app.post('/api/chat/stream', async (req, res) => {
    const { history, modelName, systemInstruction, useGrounding, useCodeExecution } = req.body;

    try {
        console.log(`[Chat] Model: ${modelName}, Grounding: ${useGrounding}`);

        const modelParams = {
            model: modelName || 'gemini-2.0-flash',
            systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
            tools: []
        };

        if (useGrounding) modelParams.tools.push({ googleSearch: {} });
        if (useCodeExecution) modelParams.tools.push({ codeExecution: {} });

        if (modelParams.tools.length === 0) delete modelParams.tools;

        const model = genAI.getGenerativeModel(modelParams);

        // Prep history
        const chatHistory = history.map(msg => ({
            role: msg.role,
            parts: msg.parts
        }));

        const lastMessage = chatHistory.pop();
        if (!lastMessage || lastMessage.role !== 'user') {
            return res.status(400).json({ error: "Last message must be from user" });
        }

        // Ensure history starts with a user message (API requirement)
        while (chatHistory.length > 0 && chatHistory[0].role !== 'user') {
            chatHistory.shift();
        }

        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessageStream(lastMessage.parts);

        // Set headers for SSE (Server-Sent Events) styled streaming or just direct chunked
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        for await (const chunk of result.stream) {
            let chunkText = "";
            try {
                chunkText = chunk.text();
            } catch (e) {
                const parts = chunk.candidates?.[0]?.content?.parts || [];
                for (const part of parts) {
                    if (part.executableCode) chunkText += `\n\`\`\`python\n${part.executableCode.code}\n\`\`\`\n`;
                    if (part.codeExecutionResult) chunkText += `\n> Output:\n\`\`\`\n${part.codeExecutionResult.output}\n\`\`\`\n`;
                }
            }
            if (chunkText) {
                res.write(chunkText);
            }
        }

        res.end();

    } catch (error) {
        console.error("Chat error:", error);
        const parsed = parseGeminiError(error);
        // If headers already sent, we can't send JSON error. 
        // But for a stream, we usually just end or send an error chunk if protocol allows.
        // Here we'll try to send a JSON error if nothing sent yet.
        if (!res.headersSent) {
            res.status(500).json({ error: parsed });
        } else {
            res.write(`\n[ERROR: ${parsed.message}]`);
            res.end();
        }
    }
});

// 3. Image Generation
app.post('/api/generate/image', async (req, res) => {
    const { prompt } = req.body;

    try {
        console.log(`[Image] Generating for: "${prompt}"`);
        // Using Gemini 2.0 Flash Experimental
        // Direct REST call is often easier for this specific experimental endpoint if SDK lags
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || response.statusText);
        }

        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find(p => p.inlineData && p.inlineData.mimeType.startsWith('image/'));

        if (imagePart) {
            res.json({ image: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType });
        } else {
            const textPart = parts.find(p => p.text);
            throw new Error(textPart ? textPart.text : "No image generated");
        }

    } catch (error) {
        console.error("Image gen error:", error);
        const parsed = parseGeminiError(error);
        res.status(500).json({ error: parsed });
    }
});

const cheerio = require('cheerio');

// ... (other imports)

// 4. Web Scraping
app.post('/api/scrape', async (req, res) => {
    const { url } = req.body;
    try {
        console.log(`[Scrape] Fetching: ${url}`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove scripts, styles, and other noise
        $('script, style, iframe, noscript, svg, img').remove();

        // Extract text
        let text = $('body').text();
        // Clean up whitespace
        text = text.replace(/\s+/g, ' ').trim();

        // Limit text length to avoid token limits (approx 10k chars)
        const maxLength = 10000;
        if (text.length > maxLength) {
            text = text.substring(0, maxLength) + "... [Content Truncated]";
        }

        const title = $('title').text() || url;

        res.json({ title, content: text });
    } catch (error) {
        console.error("Scrape error:", error);
        res.status(500).json({ error: error.message });
    }
});

// 5. Web Search (Scraping DuckDuckGo HTML)
app.post('/api/search', async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: "Query required" });

    try {
        console.log(`[Search] Querying: ${query}`);
        const searchUrl = `https://html.duckduckgo.com/html?q=${encodeURIComponent(query)}`;

        const response = await fetch(searchUrl, {
            headers: {
                // User-Agent is often required to avoid 403
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) throw new Error(`Failed to fetch search results: ${response.statusText}`);

        const html = await response.text();
        const $ = cheerio.load(html);

        const results = [];
        $('.result').each((i, el) => {
            if (i >= 5) return; // Limit to top 5
            const title = $(el).find('.result__a').text().trim();
            const link = $(el).find('.result__a').attr('href');
            const snippet = $(el).find('.result__snippet').text().trim();

            if (title && link) {
                results.push({ title, link, snippet });
            }
        });

        res.json({ results });

    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
});
