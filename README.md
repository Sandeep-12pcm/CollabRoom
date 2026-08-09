# 🚀 CollabRoom

**CollabRoom** is a real-time collaborative coding platform that lets developers create shared rooms, write code together, and exchange snippets instantly — all in the browser.

It is designed to be **fast, minimal, and developer-friendly**, focusing on real collaboration rather than heavy setup.

---

## ✨ Core Features

### 🔐 Room-Based Collaboration
- Create a room with a unique room code  
- Anyone with the code can join instantly  
- No project setup or repository required  

### 📄 Multi-Page Rooms
- Each room can contain **multiple pages**
- Pages act like independent files
- Collaborators can work on different code blocks simultaneously

### 🌐 Language-Specific Editors
- Each page supports **its own programming language**
- Syntax highlighting adapts per page
- Ideal for polyglot discussions (JS, Python, SQL, etc.)

### 💻 Real-Time Code Sync
- Changes are synced live across all connected users
- Powered by WebSockets for low-latency updates
- Designed to stay responsive even with multiple collaborators

### 🤖 AI-Assisted Coding (Optional)
Integrated AI helpers can:
- Explain selected code
- Suggest improvements
- Help debug common issues
- Provide optimization hints

> AI is designed as an assistant — not a replacement for developer thinking.

---

## 🧱 Tech Stack

CollabRoom is built using modern, stable tools that scale well.

### Frontend
- **Framework**: React 18 (Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Code Editors**:
  - Monaco Editor (VS Code–like experience)
  - CodeMirror (lightweight editing where needed)
- **Routing**: React Router
- **Deployment**: Vercel

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express
- **Real-time Communication**: Socket.IO
- **Authentication & Database**: Supabase
- **AI Providers**:
  - OpenAI API
  - Groq SDK
- **Deployment**: Render / Railway / VPS (configurable)

---

## 🏁 Getting Started

### Prerequisites
- Node.js **v18 or higher**
- npm or yarn
- Supabase account (free tier works)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/sandeep-12pcm/CollabRoom.git
cd CollabRoom
```

### 2️⃣ Install Dependencies

**Frontend**
```bash
cd client
npm install
```

**Backend**
```bash
cd ../server
npm install
```

### 3️⃣ Environment Variables

Create `.env` files in both `client` and `server` directories.

**client/.env**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:5000
```

**server/.env**
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
OPENAI_API_KEY=your_openai_key
GROQ_API_KEY=your_groq_key
```

### 4️⃣ Run the Application

**Backend**
```bash
cd server
npm run dev
```

**Frontend**
```bash
cd ../client
npm run dev
```
