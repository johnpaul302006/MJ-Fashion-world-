@echo off
title MJ Store - Dev Server
cd /d "%~dp0"

netstat -an | findstr ":3000 " | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo.
    echo   ================================================
    echo    The store is ALREADY RUNNING!
    echo    Just open this link in your browser:
    echo.
    echo        http://localhost:3000
    echo.
    echo    (No need to start it again.)
    echo   ================================================
    echo.
    pause
    exit /b 0
)

echo Starting the store... wait for "Ready" then open http://localhost:3000
echo To STOP later: close this window.
echo.
npm run dev
pause