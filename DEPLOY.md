# Deployment Guide

## 1. Fixing the "Blank Screen"
If you see a blank screen on GitHub Pages, it's because the `base` path was missing. 
**We have fixed this in `vite.config.js` by setting `base: '/my-ai/'`.**

Once you push this update, the frontend should load correctly.

## 2. Important: Backend Limitations
**GitHub Pages only hosts static sites.** It CANNOT run your Node.js backend server (`server/index.js`).

**Consequences:**
- The chat will **NOT WORK** on GitHub Pages because it needs the backend to talk to Google Gemini securely.
- You will see "Failed to fetch" errors even if the UI loads.

## 3. Recommended Solution (Full Stack Deployment)
To make the app fully functional, you need to deploy both the frontend and backend. 

### Recommended: Render.com (Free Tier)
1.  **Sign Up**: Go to [render.com](https://render.com) and sign up (GitHub login recommended).
2.  **New Service**: Click "New +" and select **"Web Service"**.
3.  **Connect Repo**: Select your `my-ai` repository.
4.  **Configure Settings**:
    *   **Name**: `my-ai-backend` (or similar)
    *   **Root Directory**: `server`   <-- **IMPORTANT**
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node index.js`
5.  **Environment Variables**:
    *   Scroll down to "Environment Variables".
    *   Add Key: `GEMINI_API_KEY`
    *   Add Value: (Paste your actual API key from your `.env` file)
6.  **Deploy**: Click "Create Web Service".

### After Deployment
Render will give you a public URL (e.g., `https://my-ai-backend.onrender.com`).
**You must copy this URL and tell the AI Assistant (or update `VITE_API_BASE_URL` in the frontend code) to complete the connection.**

### Alternative: Local Demo
Since this is a personal project, the easiest way to show it off is running it locally (`npm run dev`) where both parts work perfectly.
