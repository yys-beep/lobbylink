<h1 align="center">LobbyLink 🚀</h1>

<p align="center">
  <strong>Real-Time Campus Coordination</strong><br>
  A context-aware coordination platform adapting to different collaboration needs (study, food ordering, carpooling, and project coordination) within a single shared system.
</p>

<p align="center">
  <a href="https://lobbylinkk.netlify.app/"><b>Live Demo</b></a> •
  <a href="https://drive.google.com/file/d/1PLQnN5cepzcufBt9hjTh7JOJ7LogOxIl/view?usp=sharing"><b>Demo Video</b></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React" />
  <img src="https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase" alt="Firebase" />
</p>

---

## ⚡ Quick Access (For Reviewers)

To bypass the registration flow and test the core permission models and real-time synchronization, use these provisioned test accounts. *Note: Roles are dynamic. Any user can be an Owner of their own group while being a Member of another.*

| Account | Email | Password |
| :--- | :--- | :--- |
| **Test Account 1 (Alice)** | `alice@test.com` | `123456` |
| **Test Account 2 (Bob)** | `bob@test.com` | `123456` |

> 💡 **Testing Tip:** Open Alice in your main browser and Bob in an Incognito/Private window. This allows you to test the real-time chat, join-request pipeline, and UI synchronization side-by-side!

---

## ✨ Key Features

* **Real-Time Synchronization:** Powered by Firestore `onSnapshot` listeners for instant updates across users without page refreshes.
* **Context-Aware Group Tools:** Dynamically renders UI widgets based on the lobby category:
  * 🍔 **FOOD:** Shared item order cart with live total (RM) calculation.
  * 📚 **STUDY:** Availability polling and shared resource links.
  * 🚗 **CARPOOL:** Automatic toll/petrol cost-splitting calculator.
* **Vetted Request Pipeline:** Owners must accept or decline join requests via a Trust Profile modal (no open-join links).
* **Opt-In Chat System:** Real-time messaging with typing indicators, presence tracking, and pinned announcements.
* **Presence Tracking:** Live online green-dot indicators utilizing browser `beforeunload` lifecycle detection.

---

## 📸 Previews

*(Drag and drop your Discover Feed screenshot here)*  
**Discover Dashboard:** Omni-search and category filtering.

*(Drag and drop your Context-Aware UI screenshot here)*  
**Context-Aware Tools:** Dynamic rendering based on group objectives.

*(Drag and drop your Chat & Presence screenshot here)*  
**Real-Time Sync:** Live presence tracking and opt-in chat.

---

## 🏗️ Architecture & Data Flow

LobbyLink utilizes a serverless architecture heavily optimized for NoSQL read/write efficiency. 

**Data Flow Sequence:**  
`User Action` ➔ `React UI State Update` ➔ `Firestore Write` ➔ `onSnapshot Trigger` ➔ `Global UI Sync`

**Optimizations:**
* **NoSQL Denormalization:** User details (`displayName`, `uid`) are embedded directly into the group document to eliminate secondary database queries.
* **Lazy Initialization:** Sub-collections for chat messages are only created if the owner explicitly enables the feature, saving database resources on transient groups.

---

## 🛠️ Local Installation

1. **Clone the repository:**
```bash
   git clone [https://github.com/yys-beep/lobbylink.git](https://github.com/yys-beep/lobbylink.git)
   cd lobbylink
Install dependencies:

Bash
   npm install
Configure Environment Variables:
Create a .env file in the root directory and add your Firebase config:

Code snippet
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
Start the development server:

Bash
   npm run dev
