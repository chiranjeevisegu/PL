# Premier League Live Intelligence Hub ⚽

A full-stack web application designed for Premier League fans and FPL (Fantasy Premier League) managers. It provides live standings, real-time player data, historical milestones, and a powerful tactical Squad Builder—all wrapped in a clean, modern, and highly responsive UI.

**🌍 Live Demo:** [https://pl-gnzf.onrender.com/](https://pl-gnzf.onrender.com/)

## Features

- **Auth System**: Secure login and registration with local SQLite storage. (Demo credentials: `admin` / `admin`).
- **Live FPL Radar**: Real-time stats for all 600+ Premier League players directly from the official FPL API.
- **Dynamic Pitch Builder**: Drag, drop, and construct your 15-man squad within a £100.0M budget constraints, fully synchronized with your real FPL team via ID.
- **Captain Advisor**: AI-driven tool scoring players based on form, ICT index, ownership, and fixture difficulty to recommend the best gameweek captain.
- **H2H History**: Click any live fixture to see the last 5 head-to-head meetings between the clubs.
- **Player Compare**: Side-by-side radar chart visualization comparing any two players' metrics.
- **PL Intelligence Bot**: A floating live-data aware chatbot trained on Premier League history, rules, FPL tips, and live player/standings data.
- **Deadline Notifications**: A top-bar countdown to the upcoming Fantasy Premier League transfer deadline.

## Tech Stack

- **Frontend**: React (Vite), Lucide Icons, Chart.js, Canvas-Confetti, CSS Grid/Flexbox
- **Backend**: FastAPI (Python), Uvicorn, aiohttp (for async FPL API polling)
- **Database**: SQLite (local `pl_app.db`)

## Project Structure
```text
/PL
├── server.py              # Main FastAPI backend, handles auth, DB, and FPL proxy endpoints
├── requirements.txt       # Python dependencies
├── /frontend              
│   ├── package.json       # Node dependencies
│   ├── vite.config.js     # Vite configuration
│   └── /src               
│       ├── App.jsx        # Main application state & routing
│       ├── index.css      # Global styles (Clean Light Theme)
│       └── /components    # Feature modules (Auth, FPL, Home, Players, PLLive, SquadBuilder, Chatbot)
```

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (3.10+)

### 1. Backend Setup
Navigate to the root directory and set up the Python environment:
```bash
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```
Start the FastAPI server:
```bash
python -m uvicorn server:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup
Open a new terminal and navigate to the frontend directory:
```bash
cd frontend
npm install
npm run dev
```

### 3. Usage
- **Live Version**: Visit [https://pl-gnzf.onrender.com/](https://pl-gnzf.onrender.com/)
- **Local Version**: Open `http://localhost:5173` (or the URL Vite provides).
- Log in with the demo account (`admin` / `admin`) or create a new one.
- Explore the live tabs and build your squad!

## Design Philosophy

The application features a **Clean Light Theme**, moving away from heavy dark/glassmorphic patterns to provide a crisp, highly readable, standard e-commerce/sports analytics UI style (similar to Amazon or Myntra). It utilizes the Premier League's signature Purple (`#38003c`) and Green (`#00ff87`) as smart accent colors over standard white cards and soft gray backgrounds.

## License
MIT License.
