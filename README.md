# FinTrack — Offline-First Financial Tracker

A highly optimized, cross-platform mobile financial tracker built with React Native (Expo SDK 54), local SQLite (offline-first architecture), Firebase Firestore synchronization, and advanced AI-powered transaction parsing.

---

## ⚡ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React Native + Expo SDK 54 (TypeScript) |
| **Navigation** | Expo Router v6 (file-based navigation) |
| **Local Database** | SQLite via `expo-sqlite` (WAL mode enabled, robust migrations) |
| **Remote Database** | Firebase Firestore (cloud sync singleton) |
| **AI Parsing Engine** | Cerebras API running **Llama 3.1 8B** (ultra-low latency structured parser) |
| **Speech-to-Text** | OpenAI Whisper API (`whisper-1`) via `expo-av` recording |
| **Audio Verification** | Local Playback engine via `expo-av` Sound API |
| **Data Visualization** | Custom, interactive SVG charts via `react-native-svg` |
| **Network Sync** | Custom synchronization worker + `expo-network` monitoring |

---

## ✨ Features & AI Capabilities

### 🎙️ Advanced Voice + AI Mode
* **Tap-to-Record Experience**: Simple, intuitive single tap to start and single tap to stop recording (no awkward holding gestures).
* **AI NLP Parsing**: Automatically transcribes Indonesian and English phrases using **OpenAI Whisper**, then extracts structured categories, amounts, dates, and descriptions using **Llama 3.1 8B** on Cerebras' ultra-fast network.
* **Local Playback Verification System**: If transcription fails (e.g. 429 quota limits or offline status), Fintrack enables offline playback so you can instantly listen to your recorded `.m4a` file and verify your microphone hardware works 100%!

### 🤖 AI Chat Parser
* Talk to your finance assistant in natural language. Features robust support for shorthand numbers like `K` / `k` (thousands), `M` / `m` (millions), `rb` / `ribu`, and `jt` / `juta`.
* **Smart Rejection Modals**: Rejects gibberish, questions, or non-transaction descriptions with helpful correction prompts rather than throwing database errors.

### 🔌 Reliable Offline-First Syncing
* **Instant Interaction**: Every single transaction is written to your local SQLite database in under **10ms**, regardless of internet quality.
* **Smart Backups**: When Fintrack detects an active network connection, a background sync worker compiles a Firestore `WriteBatch` to merge the local state with your private cloud database.

---

## 🛠️ Setup & Development

### 1. Configure Firebase App
1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com).
2. Enable the **Firestore Database** in test/production mode.
3. Add a **Web App** under project settings and copy the configuration details.

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Populate the file with your keys:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...

EXPO_PUBLIC_CEREBRAS_API_KEY=csk-...
EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-...
```

### 3. Install and Launch
```bash
# Install dependencies with legacy peer support
npm install --legacy-peer-deps

# Start the Expo Dev Client / Metro Bundler
npm start 

# or 
npx expo start --clear
```