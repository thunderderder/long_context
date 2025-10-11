@echo off
chcp 65001 >nul
echo ======================================
echo    AI 写作助手 - 部署检查工具
echo ======================================
echo.

REM 检查 curl 是否可用
where curl >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未找到 curl 命令
    echo 请确保 Windows 10 1803 或更高版本
    pause
    exit /b 1
)

REM 获取 URL
if "%~1"=="" (
    set /p BACKEND_URL="请输入后端 URL (例如: https://your-backend.railway.app): "
    set /p FRONTEND_URL="请输入前端 URL (例如: https://your-app.vercel.app): "
) else (
    set BACKEND_URL=%~1
    set FRONTEND_URL=%~2
)

echo.
echo 正在检查服务状态...
echo.

REM 检查后端健康
echo 检查后端健康检查...
curl -s -o nul -w "HTTP状态码: %%{http_code}" --max-time 10 "%BACKEND_URL%/api/health"
echo.

REM 检查前端
echo.
echo 检查前端服务...
curl -s -o nul -w "HTTP状态码: %%{http_code}" --max-time 10 "%FRONTEND_URL%"
echo.

echo.
echo ======================================
echo          检查完成
echo ======================================
echo.
echo 📱 前端地址: %FRONTEND_URL%
echo 🔧 后端地址: %BACKEND_URL%
echo.
echo 💡 提示：
echo   - HTTP 200 表示服务正常
echo   - HTTP 404 可能是路径错误
echo   - HTTP 500 表示服务器错误
echo   - 超时表示服务无法访问
echo.

pause

