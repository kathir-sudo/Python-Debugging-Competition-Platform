# PyCompete: Python Debugging Competition Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-cyan)
![Node](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green)
![Python](https://img.shields.io/badge/Execution-Pyodide%20(WASM)-yellow)

**PyCompete** (also known as PyDebug) is a full-stack, sci-fi themed competitive programming platform designed for "Debugging Competitions." Unlike standard coding contests where you write code from scratch, contestants are given broken code and must fix bugs to pass test cases.

## 🚀 Key Features

*   **Client-Side Python Execution:** Uses **Pyodide** (WebAssembly) to run Python code directly in the browser. This ensures security (no arbitrary code execution on the server) and scalability.
*   **Real-time Leaderboard:** Live updates of team rankings based on score and submission time.
*   **Admin Dashboard:** A protected interface to manage problems, teams, view live submissions, broadcast announcements, and pause the competition.
*   **Anti-Cheat Mechanisms:**
    *   Tab-switch detection and counting.
    *   Copy/Paste/Right-click blocking.
    *   Automatic disqualification thresholds.
*   **Interactive Code Editor:** Built with **Ace Editor** supporting syntax highlighting and auto-completion.
*   **Sci-Fi UI/UX:** A responsive, dark-mode interface with immersive glassmorphism effects.

## 🛠️ Tech Stack

### Frontend
*   **React 18** with TypeScript
*   **Vite** (Build tool)
*   **Tailwind CSS** (Styling)
*   **Pyodide** (Python WebAssembly runtime)
*   **Chart.js** (Analytics visualization)

### Backend
*   **Node.js** & **Express**
*   **MongoDB** & **Mongoose** (Database)

---

## 📦 Installation & Setup

### Prerequisites
1.  **Node.js** (v16+)
2.  **MongoDB** (Running locally or a cloud URI)

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/pycompete.git
cd pycompete
```

### 2. Install Dependencies
You need to install dependencies for both the frontend (root) and the backend (`/server`).

**Root (Frontend):**
```bash
npm install
```

**Server (Backend):**
```bash
cd server
npm install
cd ..
```

### 3. Environment Configuration

Create a `.env` file in the `server/` directory:

```bash
# server/.env
PORT=5001
MONGODB_URI=mongodb://localhost:27017/pycompete
```
*Note: If you are using MongoDB Atlas, replace the URI with your connection string.*

### 4. Run the Application
We use `concurrently` to run both the React frontend and the Express backend with a single command from the root directory.

```bash
npm start
```

*   **Frontend:** Accessible at `http://localhost:5173`
*   **Backend:** Running on `http://localhost:5001`

---

## 🎮 How to Use

### 👮 Admin Access
1.  Navigate to `http://localhost:5173`.
2.  Enter **Team Name**: `Admin` (case insensitive).
3.  Enter **Password**: `admin123` (Default password).
4.  **Dashboard Features:**
    *   **Controls:** Start/Stop/Pause competition, set timers, broadcast messages.
    *   **Problems:** Create, edit, or delete coding challenges.
    *   **Teams:** Manage active teams, disqualify cheaters, or adjust scores.
    *   **Submissions:** View a live feed of all code submissions.

### 👨‍💻 Contestant Access
1.  Navigate to `http://localhost:5173`.
2.  Enter a unique **Team Name** to register/login.
3.  Wait for the admin to start the competition.
4.  **Gameplay:**
    *   Select a problem from the left panel.
    *   Read the description and the provided *buggy* code.
    *   Fix the code in the editor.
    *   Click **Run Tests** to check visible cases locally (via Pyodide).
    *   Click **Submit** to send your solution to the server.

---

## 🛡️ Architecture Note: Pyodide

This application uses **Pyodide** to execute Python code.
1.  When the app loads, it fetches the Pyodide WebAssembly binaries from a CDN.
2.  When a user runs code, it is executed inside the browser's JavaScript thread.
3.  **Security:** Because code runs on the client, the server is safe from malicious inputs (like `os.system('rm -rf /')`).
4.  **Validation:** While the client runs tests for immediate feedback, the backend stores the submission results. *Note: In a strictly competitive environment without internet restrictions, server-side re-validation is recommended for production security, though client-side suffices for casual events.*

## 📂 Project Structure

```
pycompete/
├── src/
│   ├── components/    # React UI Components
│   ├── services/      # API and Pyodide services
│   ├── hooks/         # Custom React hooks
│   └── types/         # TypeScript definitions
├── server/
│   ├── models/        # Mongoose Database Schemas
│   ├── routes/        # Express API endpoints
│   └── server.js      # Backend entry point
└── ...config files
```
