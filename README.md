# ☀️ Chhaya (छाया) - Heatwave & Cooling Center Management System

Chhaya is a full-stack web application designed to help communities manage heatwave alerts, map heat hotspots, locate cooling centers, and coordinate emergency response teams.

---

## 📌 Table of Contents
1. [Project Overview](#-project-overview)
2. [Tech Stack & Libraries](#-tech-stack--libraries)
3. [Folder Structure](#-folder-structure)
4. [Environment Setup (`.env`)](#-environment-setup-env)
5. [Installation & Getting Started](#-installation--getting-started)
6. [Running the Application](#-running-the-application)
7. [API Endpoint Reference](#-api-endpoint-reference)
8. [Git & Collaboration Best Practices](#-git--collaboration-best-practices)
9. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🚀 Project Overview

* **Frontend**: React 19 single-page app built with Vite, Tailwind CSS v4, and React Leaflet maps.
* **Backend**: Node.js & Express RESTful API server connected to MongoDB database.
* **Key Capabilities**:
  * Heatwave alert distribution.
  * Interactive map listing heat hotspots & nearby cooling centers.
  * Emergency team check-ins and tracking.
  * User authentication & role management.

---

## 🛠 Tech Stack & Libraries

### **Frontend (`/frontend`)**
| Library / Framework | Version | Purpose |
| :--- | :--- | :--- |
| **React** | `^19.2.8` | UI Library for building interactive user interfaces |
| **Vite** | `^8.2.0` | Next-generation frontend build tool and dev server |
| **React Router DOM** | `^7.18.2` | Client-side routing across pages |
| **Leaflet & React-Leaflet** | `^1.9.4` / `^5.0.0` | Interactive map visualizer for hotspots & cooling centers |
| **Tailwind CSS** | `^4.3.3` | Utility-first CSS framework for styling |
| **Axios** | `^1.19.0` | Promise-based HTTP client for API communication |
| **Oxlint** | `^1.75.0` | Fast JavaScript / React linter |

### **Backend (`/backend`)**
| Library / Framework | Version | Purpose |
| :--- | :--- | :--- |
| **Express** | `^5.2.1` | Web framework for Node.js REST API server |
| **MongoDB / Mongoose** | `^7.5.0` / `^9.8.1` | Database client & Object Data Modeling (ODM) |
| **JSONWebToken (`jsonwebtoken`)** | `^9.0.3` | User authentication via JWT tokens |
| **BcryptJS (`bcryptjs`)** | `^3.0.3` | Password hashing for secure user auth |
| **Dotenv (`dotenv`)** | `^17.4.2` | Environment variables loader |
| **Cors (`cors`)** | `^2.8.6` | Cross-Origin Resource Sharing middleware |
| **Nodemon (`nodemon`)** | `^3.1.14` | Hot-reloading server monitor during development |

---

## 📂 Folder Structure

```
Chhaya/
├── package.json              # Root package configuration (convenience scripts)
├── README.md                 # Project documentation (this file)
├── .gitignore                # Root Git ignore rules
│
├── backend/                  # Express REST API Server
│   ├── config/
│   │   └── db.js             # MongoDB connection logic
│   ├── controllers/          # Business logic handlers
│   ├── middleware/           # Auth and error middleware
│   ├── models/               # Mongoose DB Schemas (User, Hotspot, CoolingCenter, etc.)
│   ├── routes/               # Express API Routes
│   │   ├── alertRoutes.js
│   │   ├── authRoutes.js
│   │   ├── checkInRoutes.js
│   │   ├── coolingCenterRoutes.js
│   │   ├── hotspotRoutes.js
│   │   └── teamRoutes.js
│   ├── .env                  # Backend secrets & configuration (Ignored by Git)
│   ├── .gitignore            # Backend Git ignore rules
│   ├── package.json          # Backend dependencies & npm scripts
│   └── server.js             # Express entry point
│
└── frontend/                 # React Frontend Application
    ├── public/               # Static public assets
    ├── src/
    │   ├── assets/           # Images & Icons
    │   ├── components/       # Reusable UI components
    │   ├── context/          # React Context (Auth, Global State)
    │   ├── pages/            # View pages (Home, Map, Dashboard, etc.)
    │   ├── services/         # Axios API calls
    │   ├── utils/            # Helper functions
    │   ├── App.jsx           # Root App component with routes
    │   └── main.jsx          # Vite React DOM mounting point
    ├── .gitignore            # Frontend Git ignore rules
    ├── index.html            # HTML layout
    ├── package.json          # Frontend dependencies & npm scripts
    └── vite.config.js        # Vite build configuration
```

---

## 🔑 Environment Setup (`.env`)

Create a `.env` file inside the `backend/` directory with the following variables:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/chhaya
JWT_SECRET=your_jwt_secret_key_here
WEATHER_API_KEY=your_weather_api_key_here
```

> ⚠️ **Note:** `.env` contains sensitive secrets and database URLs. **Never commit `.env` to Git**.

---

## 📥 Installation & Getting Started

### 1. Clone the repository
```powershell
git clone https://github.com/Harshil2308/Chhaya.git
cd Chhaya
```

### 2. Install Dependencies
Install packages for both backend and frontend:

* **Backend Installation:**
  ```powershell
  cd backend
  npm install
  cd ..
  ```

* **Frontend Installation:**
  ```powershell
  cd frontend
  npm install
  cd ..
  ```

---

## 🚀 Running the Application

### 1. Run the Backend Server
From the `backend` folder:
```powershell
cd backend
npm run dev
```
*(Server will start on `http://localhost:5000`)*

### 2. Run the Frontend App
From the `frontend` folder:
```powershell
cd frontend
npm run dev
```
*(App will run on `http://localhost:5173` or port assigned by Vite)*

---

## 📡 API Endpoint Reference

### **Authentication (`/api/auth`)**
* `POST /api/auth/register` — Register a new user
* `POST /api/auth/login` — Authenticate user & get JWT token

### **Alerts (`/api/alerts`)**
* `GET /api/alerts` — Fetch active heatwave alerts
* `POST /api/alerts` — Create a new alert (Admin/Authorized)

### **Hotspots (`/api/hotspots`)**
* `GET /api/hotspots` — Get list/coordinates of heat hotspots

### **Cooling Centers (`/api/cooling-centers`)**
* `GET /api/cooling-centers` — Get list of available cooling centers

---

## 🤝 Git & Collaboration Best Practices

### 🛑 DO NOT Commit `node_modules`
* `node_modules` is listed in `.gitignore` and must **never** be pushed to Git repository.
* `node_modules` contains platform-specific binaries (e.g. Windows vs macOS vs Linux) and thousands of files.

### 🔄 Collaborator Workflow (When pulling new changes):
When your teammate pushes new changes or installs a new package:

1. **Pull the latest code:**
   ```powershell
   git pull origin main
   ```
2. **Sync installed packages on your local machine:**
   ```powershell
   # Update backend packages if updated
   cd backend
   npm install

   # Update frontend packages if updated
   cd ../frontend
   npm install
   ```

---

## ❓ Troubleshooting & FAQ

#### Q1: `Missing script: "dev"` when running `npm run dev`
* **Cause**: You ran `npm run dev` in the root folder or `backend/` before the script was configured.
* **Fix**: Run `npm run dev` inside `frontend/` (or `backend/` now that `backend/package.json` script is added).

#### Q2: `MongoDB Connection Failed`
* **Cause**: Local MongoDB service is not running or `MONGO_URI` in `backend/.env` is incorrect.
* **Fix**: Ensure MongoDB service is started on your computer (`net start MongoDB` on Windows) or check your connection string.

---