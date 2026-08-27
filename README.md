# TFI_CONNECTS 🎬

> **The Ultimate Full-Stack Digital Hub & AI Discovery Platform for Telugu Cinema**  
> Real-time box office tracking, live theatrical booking signals, AI-powered RAG movie discovery, community social buzz, and comprehensive movie metadata.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-v18-blue.svg)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen.svg)](https://mongodb.com)

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🤖 **AI Movie Discovery Chatbot** | Zero-hallucination RAG chatbot powered by Anthropic API (`claude-sonnet-5`) and MongoDB `$text` search index |
| 🎟️ **Live Theatrical & Box Office Hub** | Real-time stealth Puppeteer scraping for active showtimes, direct BookMyShow & District App booking links, and verified BookMyShow audience likes (`1.5M+ Likes`) |
| 🔍 **Dynamic Movie Search & Catalog** | Instant search and category filtering (Trending, Classics, All-Time Blockbusters, Award Winners) |
| 🎬 **Rich Movie Information Pages** | Official HD YouTube trailers & clip players, verified cast & crew profile cards with navigation, and OTT platform badges |
| 🎯 **Genre-Matched Recommendations** | Smart "More Like This" engine matching Telugu movies strictly by shared genre signatures |
| 📰 **Social & Community Buzz Hub** | Aggregated YouTube interviews, Reddit discussions (`r/tollywood`), fan wars, active polls, and industry news |
| ❤️ **Favourites & Watchlist** | Personal user collections synced to MongoDB cloud storage |
| 🌙 **Modern Glassmorphic Dark UI** | Ultra-sleek dark theme with responsive carousels, backdrop blur, and micro-animations |

---

## 🏗️ Segregated Directory Architecture

The repository is organized into distinct **frontend** and **backend** applications:

```
TFI_CONNECTS/
├── frontend/                 # Complete React (Vite) Frontend Application
│   ├── src/                  # React components, pages, custom hooks, context
│   │   ├── components/       # Glassmorphic UI components & ChatWidget
│   │   ├── hooks/            # Custom hooks (useChatbot, useFavorites, etc.)
│   │   ├── pages/            # Route-level page components (BoxOffice, MoviePage, Home)
│   │   └── services/api.js   # Centralized API service layer
│   ├── public/               # Static assets, web app manifest, favicon
│   ├── index.html            # Application HTML template
│   ├── vite.config.js        # Vite bundler configuration
│   ├── package.json          # Frontend dependencies & scripts
│   ├── .env.example          # Frontend environment template
│   └── Dockerfile            # Production Nginx container configuration
│
├── backend/                  # Complete Node.js / Express REST API Application
│   ├── server.js             # Express server entry point & security middleware
│   ├── routes/               # API route controllers (movies, boxoffice, chat, social, auth)
│   ├── models/               # Mongoose database schemas (Movie, User, Poll, Meme)
│   ├── services/             # External integrations (liveCinemaScraper, aiChatService, tmdb)
│   ├── scripts/              # Migration & index synchronization scripts
│   ├── middleware/           # Auth JWT & Error handler middleware
│   ├── package.json          # Backend dependencies & scripts
│   └── .env.example          # Backend environment template
│
├── docker-compose.yml        # Multi-container Docker orchestration
├── README.md                 # Project documentation
└── .gitignore                # Git ignore configuration
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: v20+
- **MongoDB**: MongoDB Atlas URI or local MongoDB instance
- **TMDB API Key**: [Get a free key here](https://www.themoviedb.org/settings/api)
- **Anthropic API Key**: [Get an Anthropic key here](https://console.anthropic.com/) *(optional for AI Chatbot)*

---

### 1. Clone the Repository

```bash
git clone https://github.com/madhusaicharan/TFI-_CONNECTS.git
cd TFI-_CONNECTS
```

---

### 2. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/tfi_db?retryWrites=true&w=majority
TMDB_API_KEY=your_tmdb_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-sonnet-5
JWT_SECRET=your_super_secret_jwt_key_here_min_32_chars
CORS_ORIGINS=http://localhost:5173
```

Install backend dependencies:
```bash
npm install
```

Sync MongoDB text search indexes:
```bash
node scripts/syncIndexes.js
```

---

### 3. Configure Frontend Environment

Open a new terminal window:
```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

Install frontend dependencies:
```bash
npm install
```

---

### 4. Run Development Servers

```bash
# Terminal 1 (Backend):
cd backend
node server.js

# Terminal 2 (Frontend):
cd frontend
npm run dev
```

- **Frontend App**: `http://localhost:5173`
- **Backend REST API**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/health`

---

## 🤖 AI Movie Discovery Chatbot (RAG Architecture)

**TFI_CONNECTS** includes an AI-powered movie discovery assistant built using a **Retrieval-Augmented Generation (RAG)** pattern:

- **MongoDB Text Search**: Uses a compound `$text` index covering `title`, `overview`, and `genres` with weighted relevance (`title: 10`, `genres: 5`, `overview: 1`).
- **Zero-Hallucination Policy**: Context retrieval fetches up to 8 lean movie objects per user query. System prompts strictly constrain the LLM to only recommend verified films present in our database context.
- **Google Gemini API Integration**: Powered by `gemini-2.5-flash` via `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`.
- **Protected Endpoint**: `POST /api/chat` with strict IP rate limiting (`express-rate-limit`).

---

## 🔌 API Reference

### Movies & Search
| Endpoint | Method | Description |
|---|---|---|
| `/api/movies/search?query=` | GET | Search movies in TMDB & database |
| `/api/movies/id/:id` | GET | Detailed movie metadata by ID |
| `/api/movies/category/:category` | GET | Categorized movie listings |

### Live Box Office & Theatrical Tracking
| Endpoint | Method | Description |
|---|---|---|
| `/api/boxoffice/live` | GET | Stealth-scraped BookMyShow & District live listings |
| `/api/boxoffice/movie/:id/trends` | GET | Movie trend breakdown |

### AI Chatbot (RAG)
| Endpoint | Method | Description |
|---|---|---|
| `/api/chat` | POST | RAG AI Chatbot endpoint (`{ message, history }`) |

---

## 🐳 Docker Deployment

To run both frontend and backend using Docker Compose:

```bash
docker compose up -d --build
```

- **Frontend App**: `http://localhost:80`
- **Backend API**: `http://localhost:5000`

---

## 📄 License

MIT © [Madhusaicharan](https://github.com/madhusaicharan)
