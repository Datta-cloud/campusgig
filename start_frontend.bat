@echo off
title CampusGig - Frontend Web App (Port 5173)
cd /d "%~dp0frontend"
echo ========================================================
echo Starting CampusGig Frontend Web App on http://127.0.0.1:5173
echo ========================================================
npm run dev -- --host 127.0.0.1 --port 5173
pause
