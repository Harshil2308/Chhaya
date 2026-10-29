# ☀️ Chhaya (छाया) - Heatwave Early Warning & Heat-Safety System

> **A real-time heatwave early warning, risk advisory, and heat-safety web platform built for India's outdoor workforce — construction laborers, farmers, delivery partners, and street vendors — who must work through extreme heat.**

---

## 📌 Table of Contents
1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Role-Based Portals](#-role-based-portals)
4. [Tech Stack & Dependencies](#-tech-stack--dependencies)
5. [Folder Structure](#-folder-structure)
6. [Environment Setup (`.env`)](#-environment-setup-env)
7. [Installation & Getting Started](#-installation--getting-started)
8. [Running the Application](#-running-the-application)
9. [API Endpoint Reference](#-api-endpoint-reference)
10. [Git & Collaboration Best Practices](#-git--collaboration-best-practices)
11. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🚀 Project Overview

Extreme heat events and heatwaves in India present severe occupational hazards for millions of unorganized and daily-wage outdoor workers. Unlike indoor office workers, they cannot simply avoid the sun during peak hours.

**Chhaya (छाया)** bridges this gap by translating real-time meteorological conditions into practical, life-saving safety guidance:
- Evaluates real-feel danger using the **Heat Index** (combining ambient temperature and relative humidity).
- Delivers **occupation-tailored work-rest cycles and hydration reminders** (e.g., construction workers carrying heavy loads vs. delivery personnel on two-wheelers).
- Provides an **interactive map of nearby verified cooling centers, shaded rest areas, and drinking water points** with direct navigation.
- Features an **emergency SOS response system** with 108 emergency calling, a dedicated national heat helpline, and instant WhatsApp location dispatch.
- Accommodates language and literacy barriers through **multilingual support (English, हिन्दी, ગુજરાતી)** and **high-fidelity voice read-aloud via Sarvam AI (`bulbul:v3`)**.
- Offers a dedicated **Manager Dashboard** for site supervisors to enforce safety protocols and monitor worker hydration in real time.

---

## ✨ Key Features

### 🌡️ 1. Live Heat-Risk Alerts (Heat Index Based)
* Calculates real-feel temperature and heat danger levels (**Low**, **Moderate**, **High**, **Very High**, **Extreme**) using live weather data from OpenWeatherMap.
* Automatically defaults to key urban centers (e.g., Ahmedabad) with offline fallbacks so the UI remains reliable under network constraints.

### 🛡️ 2. Occupation-Tailored Safety Guidance
* Workers select their trade (**Construction**, **Farmer**, **Delivery Partner**, **Street Vendor**, or **Other**).
* Safety advisories dynamically adjust to physical exertion levels: personalized hydration schedules, required rest intervals per working hour, and clothing recommendations.

### ⏰ 3. Safe Shift Planner (24-Hour Forecast)
* Visualizes the upcoming 24-hour weather timeline broken down into 3-hour windows.
* Flags hazardous afternoon peak heat hours (11:00 AM – 4:00 PM) and recommends safe morning and evening work windows.

### 📍 4. Nearby Cooling Centers & Interactive Map
* Built with Leaflet to display verified cooling facilities, government shelters, shaded pavilions, and public drinking water points.
* Uses the Haversine formula to compute exact distance from the worker's device to each shelter.
* One-click Google Maps direction links for fast navigation.

### 🚨 5. Crowdsourced Hotspot Reporting
* Field workers and supervisors can report hazardous heat spots, unshaded worksites, or drinking water shortages directly on the map.
* Admin dashboard allows reviewing, verifying, and updating hotspot statuses (**Pending**, **Verified**, **Resolved**).

### 🆘 6. Emergency SOS (108 + Heat Helpline + WhatsApp Dispatch)
* One-tap direct dialer to India's National Ambulance Service (`tel:108`).
* Instant dialer to the National Heat Helpline (`1800-180-1104`).
* Instant WhatsApp SOS trigger sending live GPS coordinates and emergency distress messages to registered contacts.

### 🩹 7. First-Aid Heat Illness Guide
* Rapid, illustrated guidance for identifying symptoms and taking first-aid actions for:
  * Heat Stroke (Emergency medical protocol)
  * Heat Exhaustion
  * Heat Cramps
  * Heat Rash
  * Dehydration

### 🗣️ 8. Multilingual Support & Sarvam AI Voice Read-Aloud
* Full UI static localization across 3 languages: **English**, **Hindi (हिन्दी)**, and **Gujarati (ગુજરાતી)**.
* Integrated Indian-language TTS powered by Sarvam AI (`bulbul:v3`, speaker `ritu`) with automated Indic translation, in-memory MD5 caching, and native browser SpeechSynthesis fallback for low-literacy workers.
* AI conversational heat-safety assistant powered by Sarvam AI (`sarvam-105b-conversations`) with rate limiting and emergency phrase interception.

---

## 👥 Role-Based Portals

Chhaya provides specialized interfaces customized for each user role:

| Role | Route | Key Capabilities |
| :--- | :--- | :--- |
| **Worker** | `/dashboard` | Personalized heat index, shift planner, cooling center map with distances, hotspot reporting, team hydration check-in, and emergency SOS dispatch. |
| **Manager** | `/manager` | Worksite heat conditions overview, 6-step interactive worksite safety checklist, shift planning, cooling center navigation, heat hotspot oversight, and quick emergency actions. |
| **Admin** | `/admin` | Administrative management: add/delete verified cooling centers, verify or resolve worker-reported hotspots, and audit safety alerts. |

### 👤 Demo & Seeded Accounts

| Role | Phone | Password | Target Portal | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Manager** | `9876501234` | `Manager@123` | `/manager` | Fixed controlled manager account. Seed with `npm run seed:manager` |
| **Worker** | *Any valid 10-digit* | User-chosen | `/dashboard` | Self-register on `/register` (public registration is restricted to worker) |
| **Admin** | Database-managed | Pre-configured in DB | `/admin` | Managed directly via database |

---

## 🛠 Tech Stack & Dependencies

### **Frontend (`/frontend`)**
| Package | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `^19.2.8` | Component-based UI framework |
| **Vite** | `^8.2.0` | Frontend build tool and rapid development server |
| **React Router DOM** | `^7.18.2` | Client-side routing (`/login`, `/register`, `/dashboard`, `/manager`, `/admin`, `/first-aid`) |
| **Leaflet & React-Leaflet** | `^1.9.4` / `^5.0.0` | Interactive mapping for cooling centers and heat hotspots |
| **Tailwind CSS** | `^4.3.3` | Utility-first CSS styling (via `@tailwindcss/vite`) |
| **Axios** | `^1.19.0` | HTTP client for backend REST API requests |
| **Oxlint** | `^1.75.0` | Ultra-fast linter for JavaScript and JSX code quality |

### **Backend (`/backend`)**
| Package | Version | Purpose |
| :--- | :--- | :--- |
| **Express** | `^5.2.1` | REST API application framework for Node.js |
| **MongoDB / Mongoose** | `^7.5.0` / `^9.8.1` | Database client and Object Data Modeling (ODM) |
| **JSONWebToken (`jsonwebtoken`)** | `^9.0.3` | Role-based token authentication & route protection |
| **BcryptJS (`bcryptjs`)** | `^3.0.3` | Password hashing for secure user registration and login |
| **Dotenv (`dotenv`)** | `^17.4.2` | Environment variable management |
| **Cors (`cors`)** | `^2.8.6` | Cross-Origin Resource Sharing middleware |
| **Express Rate Limit** | `^8.7.1` | API rate limiting (protects TTS and AI assistant endpoints) |
| **Sarvam AI SDK (`sarvamai`)** | `^1.1.11` | Indian-language TTS (`bulbul:v3`) and conversational AI assistant |
| **Nodemon (`nodemon`)** | `^3.1.14` | Hot-reload development server |

---

## 📂 Folder Structure

```
Chhaya/
├── package.json              # Root workspace convenience scripts
├── README.md                 # Project documentation
├── setup.bat                 # Windows automated 1-click setup script
├── setup.sh                  # macOS/Linux automated setup script
├── requirements.txt          # Dependency reference manifest
├── .gitignore                # Root Git ignore rules (blocks .env, node_modules)
│
├── backend/                  # Node.js + Express API Server
│   ├── config/
│   │   └── db.js             # MongoDB connection logic (Local & Atlas)
│   ├── controllers/          # Business logic handlers
│   │   ├── alertController.js
│   │   ├── assistantController.js
│   │   ├── authController.js
│   │   ├── checkInController.js
│   │   ├── coolingCenterController.js
│   │   ├── hotspotController.js
│   │   └── teamController.js
│   ├── middleware/           # Auth (protect, manager, admin) & rate limiting
│   ├── models/               # Mongoose schemas (User, CoolingCenter, Hotspot, Team, CheckIn)
│   ├── routes/               # API endpoint definitions
│   │   ├── alertRoutes.js
│   │   ├── assistantRoutes.js
│   │   ├── authRoutes.js
│   │   ├── checkInRoutes.js
│   │   ├── coolingCenterRoutes.js
│   │   ├── hotspotRoutes.js
│   │   ├── speakRoutes.js
│   │   └── teamRoutes.js
│   ├── utils/                # Helper utilities (heatIndex, personalRisk, sarvamClient, emergencyCheck)
│   ├── .env                  # Backend environment secrets (NEVER commit to Git)
│   ├── .env.example          # Environment variables template
│   ├── .gitignore            # Backend Git ignore rules
│   ├── package.json          # Backend dependencies & npm scripts
│   └── server.js             # Express entry point
│
└── frontend/                 # React 19 + Vite Application
    ├── public/               # Public static assets
    ├── src/
    │   ├── assets/           # Project imagery & vector icons
    │   ├── components/       # Reusable components (HeatHelper, MapView, SunPanel, SafeShiftPlanner, ListenButton, etc.)
    │   ├── context/          # React context providers (AuthContext, LanguageContext)
    │   ├── locales/          # Static translations (English, Hindi, Gujarati)
    │   ├── pages/            # Views (Login, Register, UserDashboard, ManagerDashboard, AdminDashboard, FirstAid)
    │   ├── services/         # Axios instance and API call abstractions
    │   ├── utils/            # Helper functions (geoDistance, personalizedRisk)
    │   ├── App.jsx           # Top-level client routing
    │   └── main.jsx          # React DOM mounting entry point
    ├── .gitignore            # Frontend Git ignore rules
    ├── index.html            # HTML document template
    ├── package.json          # Frontend dependencies & npm scripts
    └── vite.config.js        # Vite bundler configuration
```

---

## 🔑 Environment Setup (`.env`)

The backend requires a configuration file located at `backend/.env`.

1. Copy the example template into a real `.env` file:
   ```powershell
   # Windows PowerShell
   copy backend\.env.example backend\.env

   # macOS / Linux / Git Bash
   cp backend/.env.example backend/.env
   ```

2. Open `backend/.env` and configure your environment variables:

   ```env
   PORT=5000

   # Option A: Local MongoDB (default)
   MONGO_URI=mongodb://127.0.0.1:27017/chhaya

   # Option B: MongoDB Atlas
   # MONGO_URI=mongodb+srv://<USER>:<PASSWORD>@<CLUSTER>.mongodb.net/chhaya?retryWrites=true&w=majority

   # JWT secret for token signing
   JWT_SECRET=your_super_secret_jwt_key_here

   # OpenWeatherMap API Key (Required for live heat index & forecast)
   WEATHER_API_KEY=your_openweathermap_api_key_here

   # Sarvam AI API Key (Optional: for native Indian language voice TTS & assistant)
   SARVAM_API_KEY=your_sarvam_ai_key_here
   ```

> ⚠️ **CRITICAL SECURITY NOTE:** Never commit `backend/.env` to Git. Both root and backend `.gitignore` files are pre-configured to keep your keys safe.

---

## 📥 Installation & Getting Started

### Prerequisites
* **Node.js** (v18.x or later recommended)
* **npm** (v9.x or later)
* **MongoDB** (Local MongoDB Community Server running on port 27017 OR a free MongoDB Atlas cluster)

### 1. Clone the repository
```bash
git clone https://github.com/Harshil2308/Chhaya.git
cd Chhaya
```

### 2. Install all dependencies

Choose **any** of the following installation methods:

* **⚡ Option A: Single Command from Root**
  ```powershell
  npm run install:all
  ```
  *(Runs `npm install` inside both `backend/` and `frontend/` automatically)*

* **🖱️ Option B: Windows Automated Script**
  ```powershell
  .\setup.bat
  ```

* **🐧 Option C: macOS / Linux / Git Bash Script**
  ```bash
  chmod +x setup.sh && ./setup.sh
  ```

* **🔧 Option D: Manual Step-by-Step**
  ```bash
  cd backend && npm install
  cd ../frontend && npm install
  ```

---

## 🚀 Running the Application

For development, you need both the backend API and frontend Vite server running concurrently:

### Method 1: Two Separate Terminals (Recommended)

* **Terminal 1: Start Backend API**
  ```powershell
  cd backend
  npm run dev
  ```
  *Express server will launch on:* `http://localhost:5000`  
  *Console should confirm:* `MongoDB Connected Successfully`

* **Terminal 2: Start Frontend Web App**
  ```powershell
  cd frontend
  npm run dev
  ```
  *Vite development server will launch on:* `http://localhost:5173`

---

### Method 2: From the Root Directory

```powershell
# In terminal 1:
npm run dev:backend

# In terminal 2:
npm run dev:frontend
```

### Pre-Configuring the Official Manager Account

To seed or verify the official fixed Manager account, run:

```powershell
# From project root
npm run seed:manager

# Or from backend directory
cd backend && node scripts/seedManager.js
```

This creates or updates the official manager account:
* **Phone:** `9876501234`
* **Password:** `Manager@123`

---

Open `http://localhost:5173` in your browser. Register a new worker account on `/register` (public registration is restricted to Worker accounts) or log in with the seeded manager credentials (`9876501234` / `Manager@123`) to access the Manager Dashboard.

---

## 📡 API Endpoint Reference

All endpoints except authentication and assistant status require an `Authorization: Bearer <token>` header.

### **1. Authentication (`/api/auth`)**
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Register user (`name`, `phone`, `password`, `occupation`, `location`, `language`). Registration is strictly restricted to `worker` role; attempts to register manager/admin are enforced to worker. |
| `POST` | `/api/auth/login` | Public | Authenticate with `phone` & `password`; returns JWT token & user object |
| `GET` | `/api/auth/me` | Protected | Fetch current authenticated user's profile |
| `PUT` | `/api/auth/me` | Protected | Update profile, occupation, city location, or preferred language |

### **2. Heat Alerts & Guidance (`/api/alerts`)**
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/alerts?city={city}&job={job}` | Protected | Live heat index, temperature, humidity, danger tier, and occupation-specific work-rest guidelines |
| `GET` | `/api/alerts/forecast?city={city}` | Protected | 24-hour heat forecast timeline (3-hr blocks) and identified safe working windows |

### **3. Cooling Centers (`/api/cooling-centers`)**
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/cooling-centers` | Protected | Fetch all active cooling shelters, rest areas, and water points with coordinates |
| `POST` | `/api/cooling-centers` | Admin Only | Add a new verified cooling center |
| `DELETE`| `/api/cooling-centers/:id` | Admin Only | Delete an existing cooling center |

### **4. Hotspot Reporting (`/api/hotspots`)**
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/hotspots` | Protected | Retrieve all reported heat hotspots |
| `POST` | `/api/hotspots` | Protected | Submit a heat hotspot report (`title`, `location`, `intensity`, `description`) |
| `PUT` | `/api/hotspots/:id` | Admin Only | Update hotspot verification status (`Pending`, `Verified`, `Resolved`) |

### **5. Voice & Multilingual Assistant**
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/assistant/status` | Public | Check if Sarvam AI multilingual assistant is enabled on the server |
| `POST` | `/api/assistant` | Protected | Query conversational heat safety assistant (`message`, `language`, `city`). Includes 15 req/hr rate limiting and emergency phrase interception. |
| `POST` | `/api/speak` | Protected | Generate native audio speech via Sarvam AI TTS (`text`, `lang`: `en` \| `hi` \| `gu`). Powered by `bulbul:v3` with Indic translation and audio caching. |

### **6. Team & Check-In System (Manager Operations)**
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/teams` | Manager Only | Create a worker management team |
| `GET` | `/api/teams/my` | Protected | Retrieve teams associated with the current user |
| `POST` | `/api/teams/join` | Protected | Join a team using team code / ID |
| `POST` | `/api/checkins` | Protected | Submit hydration and safety check-in status |
| `GET` | `/api/checkins/team/:teamId`| Manager Only | View live check-in board and status of team members |

---

## 🤝 Git & Collaboration Best Practices

1. **Never Commit Secrets or Dependencies**:
   * Verify that `.env` and `node_modules/` are untracked before staging:
     ```powershell
     git status
     ```
2. **When Pulling Updates from Team Members**:
   ```powershell
   git pull origin main
   npm run install:all
   ```
3. **Use Meaningful Commits**:
   Keep commits focused on specific features or fixes (e.g., `fix: resolve MongoDB connection retry loop`, `feat: enhance manager worksite safety dashboard`).

---

## ❓ Troubleshooting & FAQ

#### Q1: `MongoDB connection failed: The uri parameter to openUri() must be a string, got "undefined"`
* **Cause**: `MONGO_URI` is missing or empty in `backend/.env`.
* **Fix**: Ensure `backend/.env` exists and contains a valid URI (e.g. `MONGO_URI=mongodb://127.0.0.1:27017/chhaya` or your MongoDB Atlas connection string).

#### Q2: `MongoDB connection failed: connect ECONNREFUSED 127.0.0.1:27017`
* **Cause**: Local MongoDB service is not started on your machine.
* **Fix**:
  * On Windows: Open Services app (`services.msc`) and start `MongoDB Server`, or run `net start MongoDB` as Administrator.
  * Alternatively, switch `MONGO_URI` to a free MongoDB Atlas cloud cluster.

#### Q3: `Port 5000 is already in use` (`EADDRINUSE`)
* **Cause**: Another Node instance or server process is already running on port 5000.
* **Fix**: Terminate the previous process or check running processes:
  ```powershell
  # Windows PowerShell
  Get-NetTCPConnection -LocalPort 5000
  Stop-Process -Id <PID> -Force
  ```

#### Q4: Weather data shows fallback or fails to load
* **Cause**: `WEATHER_API_KEY` is missing or invalid in `backend/.env`.
* **Fix**: Sign up for a free OpenWeatherMap API key at [openweathermap.org](https://openweathermap.org/) and place it in `backend/.env`. The backend has built-in offline fallbacks to keep the UI functioning even during API limits.

#### Q5: Voice read-aloud button does not play audio
* **Cause**: `SARVAM_API_KEY` is not configured.
* **Fix**: Without a Sarvam AI key, the application automatically falls back to your browser's native Web Speech API synthesis. Configure `SARVAM_API_KEY` in `backend/.env` to enable natural Indian accent voices (`bulbul:v3`, speaker `ritu`).

---

<div align="center">
  <sub>Built with ❤️ to protect outdoor workers from extreme heat stress across India.</sub>
</div>