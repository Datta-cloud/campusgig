@echo off
title CampusGig - Automated E2E Verification Test Suite
cd /d "%~dp0"
echo ========================================================
echo Running CampusGig Comprehensive 16-Scenario Test Suite
echo ========================================================
python verify_campusgig.py
pause
