@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ==================================
echo Starting AI Writing Assistant Frontend
echo ==================================
echo.

echo Current directory: %CD%
echo.

REM Check Node.js
echo [1/6] Checking Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js found

REM Check npm
echo [2/6] Checking npm...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm not found!
    echo Please install Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo [OK] npm found
echo.

REM Show versions (skip to avoid issues)
REM node --version
REM npm --version
echo.

REM Check frontend directory
echo [3/6] Checking frontend directory...
if not exist "frontend" (
    echo [ERROR] frontend directory not found!
    echo Current directory: %CD%
    echo Please run this script from the project root directory.
    echo.
    pause
    exit /b 1
)
echo [OK] frontend directory found

REM Change to frontend directory
echo [4/6] Changing to frontend directory...
cd frontend
if %errorlevel% neq 0 (
    echo [ERROR] Failed to change directory!
    echo.
    pause
    exit /b 1
)
echo [OK] Now in: %CD%
echo.

REM Check package.json
if not exist "package.json" (
    echo [ERROR] package.json not found!
    echo The frontend directory may be incomplete.
    echo.
    pause
    exit /b 1
)

REM Check node_modules
echo [5/6] Checking dependencies...
if not exist "node_modules" (
    echo [WARNING] node_modules not found!
    echo Installing dependencies... This may take a few minutes.
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Failed to install dependencies!
        echo.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencies installed successfully!
) else (
    echo [OK] node_modules found
)
echo.

REM Start the server
echo [6/6] Starting development server...
echo ==================================
echo Press Ctrl+C to stop the server
echo If browser doesn't open automatically, visit: http://localhost:3000
echo ==================================
echo.

npm start

if %errorlevel% neq 0 (
    echo.
    echo ==================================
    echo [ERROR] Frontend failed to start!
    echo Error code: %errorlevel%
    echo ==================================
    echo.
)

pause

