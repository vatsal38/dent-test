# Dent Ops OS Frontend

Internal work system for Dent Education's partnerships team.

## Features

- **Home Screen (Daily Command Center)**: Top Action, Today's Priorities, At-Risk alerts
- **Partnerships**: Pipeline view with list/kanban board and activity panel
- **Email Inbox**: Gmail integration with categorized threads
- **Runs**: Guided work sessions for repeatable operational loops

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Authentication

The app uses Google authentication only via Firebase. Users must be registered in the backend system (either as admins or via organization invites).

## Tech Stack

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Firebase Auth** - Authentication
- **React Context** - State management

## Project Structure

```
app/
  app/              # Main app pages (protected)
    page.tsx        # Home/Daily Command Center
    partnerships/   # Partnerships pipeline
    inbox/          # Email inbox
    runs/           # Guided work sessions
  login/            # Login page
  layout.tsx        # Root layout with AuthProvider
src/
  lib/              # API client and Firebase config
  context/          # Auth context
```

## Backend Integration

The frontend communicates with the backend API at `ops-leader-hub-backend`. Make sure the backend is running and accessible at the `NEXT_PUBLIC_API_URL`.

All API requests are authenticated using Firebase ID tokens sent in the `Authorization` header.
