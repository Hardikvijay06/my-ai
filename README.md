# AI Assistant

A powerful, accessible, and beautiful AI Assistant application built with React, Vite, and Google Gemini.

## Features

- **Modern UI**: Dark-themed, glassmorphism design with smooth animations.
- **Accessibility**: Semantic HTML, ARIA labels, and keyboard navigation support.
- **AI Integration**: Powered by Google Gemini for chat, image generation, and code execution.
- **Rich Media**: Supports markdown rendering, syntax highlighting, charts, and diagrams (Mermaid).
- **Voice Input**: Integrated speech recognition for hands-free interaction.
- **Local & Secure**: API keys are handled securely via a backend proxy.

## Tech Stack

- **Frontend**: React, Vite, CSS Modules
- **Backend**: Node.js, Express (for API proxying)
- **AI**: Google Generative AI SDK
- **Styling**: Custom CSS variables, Glassmorphism utilities

## Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Hardikvijay06/my-ai.git
    cd my-ai
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Setup Environment**:
    Create a `.env` file in the root directory and add your API key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

4.  **Run the application**:
    ```bash
    npm run dev
    ```
    This command starts both the frontend (User Interface) and the backend (API Proxy) concurrently.

5.  **Open in Browser**:
    Navigate to `http://localhost:5173`

