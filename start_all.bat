@echo off
title AI Surveillance System Launcher
color 0b

echo ======================================================================
echo    DEFENSE-GRADE AI SURVEILLANCE SYSTEM - SYSTEM LAUNCHER
echo ======================================================================
echo.

echo [1/3] Launching Python AI Engine (CUDA YOLOv8 + ByteTrack on Port 8765)...
start "Tier 1: Python CV Engine" cmd /k "cd /d c:\Users\mrina\Documents\surveillance system\engine && python main.py"

echo Waiting for Python Engine to initialize...
timeout /t 3 /nobreak >nul

echo [2/3] Launching Node.js Backend Server (Threat Intelligence on Port 5000)...
start "Tier 2: Node.js Backend" cmd /k "cd /d c:\Users\mrina\Documents\surveillance system\server && npm start"

echo Waiting for Backend Server to connect...
timeout /t 3 /nobreak >nul

echo [3/3] Launching React Frontend Command Center (Port 3000)...
start "Tier 3: React Frontend" cmd /k "cd /d c:\Users\mrina\Documents\surveillance system\client && npm run dev"

echo Waiting for Frontend dev server...
timeout /t 3 /nobreak >nul

echo.
echo Launching Web Browser Command Center at http://localhost:3000 ...
start http://localhost:3000

echo ======================================================================
echo  All 3 services are now running in their own separate terminal windows!
echo  To stop any service, press Ctrl + C inside its specific window.
echo ======================================================================
echo.
pause
