#!/usr/bin/env bash
# ========================================================
#       Chhaya Project - Automated Setup & Installer
# ========================================================

set -e

echo "========================================================"
echo "      Chhaya Project - Automated Setup & Installer"
echo "========================================================"
echo ""

# 1. Check for Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not installed or not in PATH!"
    echo "Please download and install Node.js (v18+) from: https://nodejs.org/"
    exit 1
fi

echo "[✓] Node.js detected: $(node -v)"
echo "[✓] npm detected: $(npm -v)"
echo ""

# 2. Setup backend .env if missing
echo "[1/3] Checking environment configuration..."
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp "backend/.env.example" "backend/.env"
        echo "[✓] Created backend/.env from template (backend/.env.example)"
        echo "    Remember to update API keys and MONGO_URI in backend/.env if needed."
    fi
else
    echo "[✓] backend/.env already exists."
fi
echo ""

# 3. Install Backend Dependencies
echo "[2/3] Installing Backend dependencies..."
echo "--------------------------------------------------------"
cd backend
npm install
cd ..
echo "[✓] Backend dependencies installed successfully!"
echo ""

# 4. Install Frontend Dependencies
echo "[3/3] Installing Frontend dependencies..."
echo "--------------------------------------------------------"
cd frontend
npm install
cd ..
echo "[✓] Frontend dependencies installed successfully!"
echo ""

echo "========================================================"
echo "      All project libraries downloaded successfully!"
echo "========================================================"
echo ""
echo "Next Steps to Start the Application:"
echo ""
echo "1. Start the Backend API (in terminal 1):"
echo "     cd backend && npm run dev"
echo ""
echo "2. Start the Frontend App (in terminal 2):"
echo "     cd frontend && npm run dev"
echo ""
echo "Or from the root directory:"
echo "     npm run dev:backend"
echo "     npm run dev:frontend"
echo ""
