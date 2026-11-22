@echo off
title CampusGig - Backend API Server (Port 8001)
cd /d "%~dp0backend"
echo ========================================================
echo Starting CampusGig Backend API on http://127.0.0.1:8001
echo ========================================================
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
pause
