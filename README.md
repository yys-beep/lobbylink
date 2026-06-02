# LobbyLink

**Real-Time Campus Coordination Platform**

LobbyLink is a context-aware coordination platform designed for campus communities. It adapts to different collaboration needs—study sessions, food ordering, carpooling, and project coordination—all within a single shared system. Built with real-time synchronization, it enables seamless group communication and task management.

[**Live Demo**](https://lobbylinkk.netlify.app/) • [**Demo Video**](https://drive.google.com/file/d/1PLQnN5cepzcufBt9hjTh7JOJ7LogOxIl/view?usp=sharing)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/firebase-%23039BE5.svg?style=for-the-badge&logo=firebase)

---

## Quick Start (For Reviewers)

To test the core permission models and real-time synchronization without registering, use these provisioned test accounts:

| Account | Email | Password |
| :--- | :--- | :--- |
| Test Account 1 (Alice) | `alice@test.com` | `123456` |
| Test Account 2 (Bob) | `bob@test.com` | `123456` |

**Testing Tip:** Open Alice in your main browser and Bob in an Incognito/Private window to test real-time chat, join-request pipelines, and UI synchronization side-by-side.

---

## Features

- **Real-Time Synchronization** — Powered by Firestore `onSnapshot` listeners for instant updates across all connected users
- **Context-Aware Group Tools** — Dynamic UI rendering based on lobby category:
  - **Food Ordering:** Shared item cart with live total calculation
  - **Study Sessions:** Availability polling and shared resource links
  - **Carpooling:** Automatic toll and petrol cost-splitting calculator
- **Trust-Based Join Requests** — Owners verify and accept/decline requests via Trust Profile modal
- **Real-Time Chat** — Messaging with typing indicators, presence tracking, and pinned announcements
- **Presence Tracking** — Live online status indicators using browser lifecycle detection

---

## Architecture

LobbyLink uses a serverless, NoSQL-optimized architecture designed for efficient read/write operations.

**Data Flow:**
```
User Action → React State Update → Firestore Write → onSnapshot Trigger → Global UI Sync
```

**Key Optimizations:**
- **NoSQL Denormalization** — User details are embedded in group documents to eliminate secondary queries
- **Lazy Initialization** — Chat sub-collections are only created when explicitly enabled by the owner

---

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yys-beep/lobbylink.git
   cd lobbylink
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory with your Firebase configuration:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

---

## Technologies

- **Frontend:** React + Vite
- **Styling:** Tailwind CSS
- **Backend:** Firebase (Firestore, Authentication)
- **Real-Time Updates:** Firestore listeners

---

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for bugs and feature requests.

---

## License

This project is open source and available under the MIT License.