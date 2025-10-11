@echo off
echo ===== Step 1: Script started =====
pause

echo.
echo ===== Step 2: Checking Node.js =====
where node
pause

echo.
echo ===== Step 3: Node version =====
node --version
pause

echo.
echo ===== Step 4: Checking npm =====
where npm
pause

echo.
echo ===== Step 5: npm version =====
npm --version
pause

echo.
echo ===== Step 6: Current directory =====
echo %CD%
pause

echo.
echo ===== Step 7: Checking frontend folder =====
if exist "frontend" (
    echo frontend folder EXISTS
) else (
    echo frontend folder NOT FOUND
)
pause

echo.
echo ===== Step 8: Changing to frontend =====
cd frontend
echo Now in: %CD%
pause

echo.
echo ===== Step 9: Checking package.json =====
if exist "package.json" (
    echo package.json EXISTS
) else (
    echo package.json NOT FOUND
)
pause

echo.
echo ===== Step 10: Checking node_modules =====
if exist "node_modules" (
    echo node_modules EXISTS
) else (
    echo node_modules NOT FOUND - Will need to run npm install
)
pause

echo.
echo ===== All checks passed! =====
echo.
echo Now you can run the real script.
echo.
pause

