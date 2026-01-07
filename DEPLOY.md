# How to Deploy Your AI Assistant

Your app is ready for the world! 🌍

## Option 1: The Easiest Way (Netlify Drop)
1.  Locate the `dist` folder in your project directory:
    `/Users/hardikvijay/Downloads/ai assistant/dist`
2.  Go to [app.netlify.com/drop](https://app.netlify.com/drop).
3.  **Drag and drop** the `dist` folder onto that page.
4.  Wait a few seconds... and boom! You have a public link (e.g., `https://hardik-ai-assistant.netlify.app`).

## ⚠️ Important: API Keys
Since this is a client-side app, **we did NOT include your personal API key** in the build for security.
- When you (or anyone experienced) opens the public link, the app will check for a key.
- If none is found, it will ASK for a Gemini API Key.
- Users can enter their own key, and it will be saved safely in their browser's *Local Storage*.

## Option 2: Vercel / GitHub Pages
If you push this code to GitHub:
- Connect your repo to Vercel/Netlify.
- Build Command: `npm run build`
- Output Directory: `dist`
