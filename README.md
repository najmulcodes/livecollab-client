# LiveCollab

A real-time collaborative workspace built with React, designed to simulate a modern SaaS collaboration environment — with a strong focus on **reliability, real-time consistency, and stable peer-to-peer communication**.

LiveCollab enables teams to manage tasks, collaborate live, and initiate WebRTC-based video calls inside a shared workspace.

---

## 🌐 Live Demo

https://livecollab-rho.vercel.app/

---

## ✨ Core Features

### 🔐 Authentication
- JWT-based authentication (login/register)
- Google OAuth integration
- Persistent session handling

---

### 🧩 Workspace System
- Create and join workspaces
- Role-based access (Owner, Admin, Member)
- Online/offline member presence tracking

---

### 📌 Task Management (Kanban)
- Drag-and-drop board (Todo / Doing / Done)
- Real-time updates across all users
- Stable state management using Zustand
- No empty-state or inconsistent UI issues

---

### 💬 Real-time Collaboration
- Socket.IO powered live updates
- Shared workspace synchronization
- Activity tracking and typing indicators

---

### 🎥 Video Calling (WebRTC)
- 1-to-1 peer-to-peer video calls
- Screen sharing via `getDisplayMedia`
- Custom signaling system (no external services)
- Full call lifecycle handling:
  - `call-user → incoming-call → answer-call → call-answered`
- Incoming call popup with accept/reject flow
- Call timeout (30s) with safe guards
- Audio feedback (ringtone + calling tone)

---

## 🧠 Engineering Focus (What Makes This Different)

This project is not just about features — it focuses on solving **real-world reliability problems**:

### ✔ Stability Improvements
- Fixed race conditions in timeout vs WebRTC signaling
- Prevented premature cleanup during async call setup
- Eliminated socket re-initialization issues
- Stabilized event → state → UI flow

### ✔ Real-time Consistency
- Ensured deterministic socket event handling
- Fixed UI inconsistency under concurrent updates
- Normalized state to avoid ID mismatch bugs

### ✔ WebRTC Reliability
- Guarded signaling flow against stale events
- Controlled lifecycle of peer connections
- Ensured stable ICE candidate exchange

---

## 🛠️ Tech Stack

**Frontend**
- React (Vite)
- Zustand
- Tailwind CSS
- Socket.IO Client
- Axios
- WebRTC APIs

**Backend**
- Node.js
- Express
- MongoDB
- Socket.IO

---

## ⚙️ Environment Variables

Create a `.env` file:

```env
VITE_API_URL=https://your-backend-url/api
VITE_SOCKET_URL=https://your-backend-url