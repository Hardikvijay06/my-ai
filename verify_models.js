
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    console.log("Using API Key:", apiKey ? "Loaded (Starts with " + apiKey.substring(0, 4) + ")" : "MISSING");

    if (!apiKey) return;

    // Direct Fetch
    try {
        console.log("--- Fetching Models via REST API ---");
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("Found " + data.models.length + " models.");
            const flash = data.models.find(m => m.name.includes('flash'));
            console.log("Flash model found:", flash ? flash.name : "NO");
            data.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`));
        } else {
            console.error("No models returned:", data);
        }

    } catch (e) {
        console.error("Direct fetch failed:", e);
    }
}

listModels();
