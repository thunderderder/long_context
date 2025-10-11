@echo off
echo ========================================
echo AI Writing Assistant - Frontend Setup
echo ========================================
echo.

cd frontend
if %errorlevel% neq 0 (
    echo [ERROR] Cannot find frontend directory!
    pause
    exit /b 1
)

echo Current directory: %CD%
echo.

REM Check if node_modules exists
if exist "node_modules" (
    echo [OK] Dependencies already installed
    echo.
) else (
    echo [INFO] Installing dependencies...
    echo This may take a few minutes. Please wait...
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
    echo.
)

echo ========================================
echo Starting development server...
echo ========================================
echo Press Ctrl+C to stop the server
echo If browser doesn't open, visit: http://localhost:3000
echo ========================================
echo.

call npm start

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start server!
    echo.
)

pause

