import { GoogleGenerativeAI } from "@google/generative-ai";

// TODO: Replace with your actual API key for local debugging, but DO NOT commit it!
const apiKey = process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE";

async function listModels() {
    console.log("Checking v1beta...");
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (data.models) {
            console.log("--- v1beta Models ---");
            data.models.forEach(m => console.log(m.name));
        }
    } catch (e) { console.error("v1beta failed", e.message); }

    console.log("\nChecking v1alpha...");
    try {
        const url = `https://generativelanguage.googleapis.com/v1alpha/models?key=${apiKey}`;
        const resp = await fetch(url);
        const data = await resp.json();
        if (data.models) {
            console.log("--- v1alpha Models ---");
            data.models.forEach(m => console.log(m.name));
        }
    } catch (e) { console.error("v1alpha failed", e.message); }
}

listModels();
