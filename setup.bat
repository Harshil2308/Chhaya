@echo off
setlocal EnableDelayedExpansion

echo ========================================================
echo       Chhaya Project - Automated Setup & Installer
echo ========================================================
echo.

REM 1. Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please download and install Node.js (v18+) from:
    echo   https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [✓] Node.js is detected:
node -v
echo [✓] npm is detected:
call npm -v
echo.

REM 2. Setup backend .env if missing
echo [1/3] Checking environment configuration...
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
        echo [✓] Created backend\.env from template (backend\.env.example)
        echo     Remember to update API keys and MONGO_URI in backend\.env if needed.
    ) else (
        echo [!] Warning: backend\.env.example not found.
    )
) else (
    echo [✓] backend\.env already exists.
)
echo.

REM 3. Install Backend Dependencies
echo [2/3] Installing Backend dependencies (Express, MongoDB, JWT, etc.)...
echo --------------------------------------------------------
cd backend
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install backend dependencies!
    cd ..
    pause
    exit /b 1
)
cd ..
echo [✓] Backend dependencies installed successfully!
echo.

REM 4. Install Frontend Dependencies
echo [3/3] Installing Frontend dependencies (React, Vite, Leaflet, etc.)...
echo --------------------------------------------------------
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install frontend dependencies!
    cd ..
    pause
    exit /b 1
)
cd ..
echo [✓] Frontend dependencies installed successfully!
echo.

echo ========================================================
echo      All project libraries downloaded successfully!
echo ========================================================
echo.
echo Next Steps to Start the Application:
echo.
echo 1. Start the Backend API (in terminal 1):
echo      cd backend
echo      npm run dev
echo.
echo 2. Start the Frontend App (in terminal 2):
echo      cd frontend
echo      npm run dev
echo.
echo Or from the root directory:
echo      npm run dev:backend
echo      npm run dev:frontend
echo.
pause
