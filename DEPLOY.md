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

### Recommended: Render.com (Free)
1.  Sign up at [render.com](https://render.com).
2.  Create a **Web Service**.
3.  Connect your GitHub repository.
4.  Set the Build Command: `npm install && npm run build`
5.  Set the Start Command: `node server/index.js`
6.  Add Environment Variable: `GEMINI_API_KEY` (your actual key).
7.  **Crucial**: You will also need to update your frontend code `src/services/ai.js` to point to this new Render URL instead of `localhost:3000`.

### Alternative: Local Demo
Since this is a personal project, the easiest way to show it off is running it locally (`npm run dev`) where both parts work perfectly.
