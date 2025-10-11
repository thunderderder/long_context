@echo off
echo Installing Backend Dependencies...
cd backend
pip install -r requirements.txt
echo.
echo Done! Please set your DEEPSEEK_API_KEY environment variable.
echo Or edit backend/app.py to set DEEPSEEK_API_KEY directly.
pause

