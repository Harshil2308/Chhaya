# Chhaya (छाया) — Heatwave Early Warning & Heat-Safety System

Built for India's outdoor workers — construction laborers, farmers, delivery partners, street vendors — who can't just step inside when it gets too hot. Chhaya gives them real-time heat risk alerts, cooling center maps, and emergency SOS, in their own language.

---

## Table of Contents
1. [What is this?](#what-is-this)
2. [Features](#features)
3. [Who uses it](#who-uses-it)
4. [Tech stack](#tech-stack)
5. [Folder structure](#folder-structure)
6. [Environment setup](#environment-setup)
7. [Installation](#installation)
8. [Running locally](#running-locally)
9. [API reference](#api-reference)
10. [Database scripts](#database-scripts)
11. [Git notes](#git-notes)
12. [Troubleshooting](#troubleshooting)

---

## What is this?

India sees severe heatwaves every summer, and the people most at risk are daily-wage workers who have no choice but to be outdoors. Chhaya tries to bridge that gap.

It pulls live weather data, calculates the actual heat index (not just temperature — humidity matters a lot), and translates that into practical advice: when to take breaks, how much water to drink, nearest place to cool down. Workers can also trigger an SOS that sends their GPS location over WhatsApp to their emergency contact.

The app supports Hindi, Gujarati, and English, and has a voice read-aloud feature for workers who may not read well.

Currently scoped to **Gujarat** — city and area selection is validated against a curated list so managers can correctly filter their teams by location.

---

## Features

**Heat alerts**
Live heat index from OpenWeatherMap. Risk levels go: Low → Moderate → High → Very High → Extreme. Falls back gracefully if the API is down or the key is missing.

**Occupation-based advice**
A construction worker carrying bricks in direct sun needs different rest cycles than a delivery partner on a two-wheeler. Workers pick their occupation on signup and the safety tips adjust accordingly.

**24-hour shift planner**
Shows the next 24 hours in 3-hour blocks. Marks the dangerous window (roughly 11 AM–4 PM) and suggests when it's safer to do heavy work.

**Cooling center map**
Leaflet map showing nearby verified cooling shelters, government rest points, and water stations. Uses Haversine to show real distance from your location. Tap to open directions in Google Maps.

**Hotspot reporting**
Workers or managers can pin a hazardous spot on the map — an unshaded worksite, a water point that's dried up, etc. Admins review and mark them Verified or Resolved.

**Emergency SOS**
One tap calls 108 (national ambulance). Another dials the heat helpline (1800-180-1104). There's also a WhatsApp button that pre-fills a distress message with the worker's GPS coordinates and sends it to their saved emergency contact.

**Settings & profile**
Photo upload with live camera capture (WebRTC). Images are compressed client-side using Canvas before saving. Workers can update their city/area, emergency contact, language, email, and password from one place.

**Password security**
On both registration and the settings page, there's a live strength bar and checklist (8+ chars, uppercase, lowercase, number, special char). The backend enforces the same rules, and there's a same-password guard so you can't "change" to what you already have.

**Multilingual + voice**
Full UI in English, हिन्दी, ગુજરાતી. Sarvam AI (`bulbul:v3`) handles TTS with a natural Indian accent. If `SARVAM_API_KEY` isn't set, it falls back to the browser's built-in speech synthesis.

**AI heat assistant**
A conversational assistant (Sarvam `sarvam-105b-conversations`) that answers heat safety questions. Rate-limited to 15 requests/hr and watches for emergency phrases to intercept and redirect.

**Gujarat location validation**
Both the frontend and backend validate that the selected city and area exist in our `gujaratData` list. The area dropdown doesn't even show until a city is picked. This keeps the data clean for manager team filtering.

---

## Who uses it

| Role | Where they go | What they can do |
|---|---|---|
| Worker | `/dashboard` | Heat alerts, shift planner, cooling map, check-in, SOS |
| Manager | `/manager` | Worksite overview, safety checklist, team check-in board |
| Admin | `/admin` | Add/remove cooling centers, verify/resolve hotspots |
| Everyone | `/settings` | Edit profile, change photo, update password |

### Demo accounts

| Role | Phone | Password |
|---|---|---|
| Admin | `9876504321` | `Admin@123` |
| Manager | `9876501234` | `Manager@123` |
| Worker | register yourself at `/register` | whatever you set |

Public registration is locked to the **worker** role only. Manager and Admin accounts have to be seeded manually (see below).

---

## Tech stack

**Frontend**
- React 19 + Vite
- React Router DOM v7
- Tailwind CSS v4
- Leaflet / React-Leaflet (map)
- Axios (API calls, with Bearer token interceptor)
- Browser WebRTC + Canvas (camera capture & image compression)

**Backend**
- Node.js + Express v5
- MongoDB + Mongoose
- JWT for auth
- bcryptjs for password hashing
- express-rate-limit on the AI/TTS endpoints
- Sarvam AI SDK for voice and assistant
- nodemon in dev

---

## Folder structure

```
Chhaya/
├── package.json              # root scripts (install:all, dev:backend, dev:frontend)
├── setup.bat / setup.sh      # one-click setup for Windows / Mac+Linux
├── requirements.txt
│
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   │   ├── authController.js       # register, login, updateMe, changePassword, getMe
│   │   ├── alertController.js
│   │   ├── assistantController.js
│   │   ├── checkInController.js
│   │   ├── coolingCenterController.js
│   │   ├── hotspotController.js
│   │   ├── managerController.js
│   │   └── teamController.js
│   ├── middleware/                 # protect, requireManager, requireAdmin
│   ├── models/                    # User, CoolingCenter, Hotspot, Team, CheckIn
│   ├── routes/
│   │   ├── authRoutes.js          # /register /login /me /change-password
│   │   ├── alertRoutes.js
│   │   ├── assistantRoutes.js
│   │   ├── checkInRoutes.js
│   │   ├── coolingCenterRoutes.js
│   │   ├── hotspotRoutes.js
│   │   ├── managerRoutes.js
│   │   ├── speakRoutes.js
│   │   └── teamRoutes.js
│   ├── scripts/
│   │   ├── seedAdmin.js
│   │   ├── seedManager.js
│   │   └── fixEmailIndex.js       # run once to migrate email index (see below)
│   ├── utils/                     # heatIndex, personalRisk, gujaratData, sarvamClient, emergencyCheck
│   ├── .env                       # never commit this
│   ├── .env.example
│   └── server.js
│
└── frontend/
    ├── public/
    └── src/
        ├── components/            # Navbar, MapView, SunPanel, HeatHelper, SafeShiftPlanner, ...
        ├── context/               # AuthContext, LanguageContext
        ├── locales/               # en, hi, gu translation files
        ├── pages/                 # Login, Register, UserDashboard, ManagerDashboard, AdminDashboard, FirstAid, Settings
        ├── services/              # Axios instance + API helpers
        ├── utils/                 # geoDistance, gujaratData, personalizedRisk
        ├── App.jsx
        └── main.jsx
```

---

## Environment setup

Create `backend/.env` by copying the example:

```bash
# Windows
copy backend\.env.example backend\.env

# Mac/Linux
cp backend/.env.example backend/.env
```

Then fill it in:

```env
PORT=5000

# local mongo
MONGO_URI=mongodb://127.0.0.1:27017/chhaya

# or Atlas
# MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/chhaya?retryWrites=true&w=majority

JWT_SECRET=something_long_and_random

# get a free key at openweathermap.org
WEATHER_API_KEY=

# optional — app works without it (falls back to browser TTS)
SARVAM_API_KEY=
```

Don't commit `.env`. Both `.gitignore` files already block it.

---

## Installation

Pick whichever way works for you:

```bash
# from project root — installs both backend and frontend
npm run install:all

# Windows script
.\setup.bat

# Mac/Linux script
chmod +x setup.sh && ./setup.sh

# manually
cd backend && npm install
cd ../frontend && npm install
```

---

## Running locally

You need two terminals — one for the backend, one for the frontend.

```bash
# terminal 1
cd backend
npm run dev
# → http://localhost:5000
# → console should say: MongoDB Connected Successfully

# terminal 2
cd frontend
npm run dev
# → http://localhost:5173
```

Or from the root if you prefer:
```bash
npm run dev:backend   # terminal 1
npm run dev:frontend  # terminal 2
```

**Seed the manager and admin accounts before logging in with them:**

```bash
node backend/scripts/seedManager.js   # or: npm run seed:manager
node backend/scripts/seedAdmin.js     # or: npm run seed:admin
```

Then open `http://localhost:5173`.

---

## API reference

All routes except `/api/auth/register`, `/api/auth/login`, and `/api/assistant/status` need `Authorization: Bearer <token>`.

### Auth & Profile — `/api/auth`

| Method | Endpoint | Who | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Required: `name`, `phone`, `password`, `city`, `areaName`, `emergencyContactName`, `emergencyContactPhone`, `language`. City + area must be valid Gujarat values. Always creates a `worker`. |
| POST | `/api/auth/login` | Public | `phone` + `password` → returns JWT + user object |
| GET | `/api/auth/me` | Authenticated | Returns current user profile |
| PUT | `/api/auth/me` | Authenticated | Update any profile field. `email` is optional but must be unique if provided. |
| PUT | `/api/auth/change-password` | Authenticated | `oldPassword` + `newPassword`. Same-password check included. |

### Heat Alerts — `/api/alerts`

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/alerts?city=&job=` | Current heat index, risk tier, and work-rest advice |
| GET | `/api/alerts/forecast?city=` | 24-hour forecast in 3-hour blocks with safe windows |

### Cooling Centers — `/api/cooling-centers`

| Method | Endpoint | Who |
|---|---|---|
| GET | `/api/cooling-centers` | Authenticated |
| POST | `/api/cooling-centers` | Admin only |
| DELETE | `/api/cooling-centers/:id` | Admin only |

### Hotspots — `/api/hotspots`

| Method | Endpoint | Who |
|---|---|---|
| GET | `/api/hotspots` | Authenticated |
| POST | `/api/hotspots` | Authenticated — fields: `title`, `location`, `intensity`, `description` |
| PUT | `/api/hotspots/:id` | Admin only — set status to `Pending` / `Verified` / `Resolved` |

### Voice & Assistant

| Method | Endpoint | Notes |
|---|---|---|
| GET | `/api/assistant/status` | Public — checks if Sarvam key is configured |
| POST | `/api/assistant` | Authenticated — `message`, `language`, `city`. Rate limited to 15/hr. |
| POST | `/api/speak` | Authenticated — `text`, `lang` (`en`/`hi`/`gu`). Returns audio via Sarvam TTS. |

### Teams & Check-ins — `/api/teams`, `/api/checkins`

| Method | Endpoint | Who |
|---|---|---|
| POST | `/api/teams` | Manager only — create a team |
| GET | `/api/teams/my` | Authenticated — teams you belong to |
| POST | `/api/teams/join` | Authenticated — join via team code |
| POST | `/api/checkins` | Authenticated — submit hydration check-in |
| GET | `/api/checkins/team/:teamId` | Manager only — live check-in board |

### Manager — `/api/manager`

Manager-specific operations. See `backend/routes/managerRoutes.js` for the full list.

---

## Database scripts

### `fixEmailIndex.js`

**Run this once if you're pulling this onto an existing database.**

Older versions had a plain unique index on `email`, which broke registration for users who didn't provide one (they'd all conflict on `null`/`""`). This script:

1. Drops the old `email_1` index
2. Clears `email: ""` and `email: null` from existing user documents (`$unset`)
3. Creates a new **partial** unique index — only enforces uniqueness when `email` is a non-empty string

```bash
node backend/scripts/fixEmailIndex.js
```

Safe to run more than once. The Mongoose schema already defines the correct index; this script just fixes existing databases that still have the old one.

---

## Git notes

- Never stage `.env` or `node_modules/`. Run `git status` before committing if you're unsure.
- After pulling: `npm run install:all` to sync dependencies.
- After pulling schema changes (like the email index): run `node backend/scripts/fixEmailIndex.js`.
- Keep commits focused — one feature or fix per commit.

---

## Troubleshooting

**`MONGO_URI` undefined on startup**
`backend/.env` doesn't exist or is empty. Copy from `.env.example` and fill in the URI.

**`ECONNREFUSED 127.0.0.1:27017`**
Local MongoDB isn't running. On Windows: `net start MongoDB` as admin, or use `services.msc`. Alternatively switch to Atlas.

**Port 5000 already in use**
```powershell
Get-NetTCPConnection -LocalPort 5000
Stop-Process -Id <PID> -Force
```

**Camera doesn't open in Settings**
Browser blocked camera access, or you're not on `localhost`/HTTPS (WebRTC requirement). Click the lock icon in the address bar → allow Camera. Or just use "Choose from Gallery" instead.

**"Current password is incorrect" on password change**
You're entering the wrong current password. It's case-sensitive.

**Weather shows fallback data**
`WEATHER_API_KEY` is missing or the free tier limit is hit. The app won't crash — it shows safe fallback values — but set a valid key for real data.

**Voice button does nothing / no audio**
`SARVAM_API_KEY` isn't set. The app falls back to the browser's Web Speech API. Set the key in `.env` to get the proper Indian-accent voice (`bulbul:v3`).

**Registration fails: "not a valid Gujarat city" or "not a valid area"**
You're sending a city or area that isn't in the validated list. Only use the values from the dropdowns in the registration form — both frontend and backend check this independently.

**`E11000 duplicate key error` on the email field**
Old database with a strict unique index on email. Run:
```bash
node backend/scripts/fixEmailIndex.js
```

---

<div align="center">
  <sub>Built to protect outdoor workers from extreme heat across India.</sub>
</div>
