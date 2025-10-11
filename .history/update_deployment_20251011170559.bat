@echo off
chcp 65001 >nul
echo ======================================
echo   AI 写作助手 - 更新部署脚本
echo ======================================
echo.

REM 检查 Git
where git >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未检测到 Git
    pause
    exit /b 1
)

echo 📥 拉取最新代码...
git pull origin main

if errorlevel 1 (
    echo ❌ 代码拉取失败
    pause
    exit /b 1
)

echo ✓ 代码更新成功
echo.

REM 检查 Docker
if exist "docker-compose.yml" (
    set /p REBUILD="检测到 Docker 配置，是否重新构建并重启？(y/n): "
    if /i "%REBUILD%"=="y" (
        echo.
        echo 🔄 重新构建和重启 Docker 容器...
        docker-compose down
        docker-compose up -d --build
        
        if errorlevel 1 (
            echo ❌ Docker 更新失败
            pause
            exit /b 1
        )
        
        echo ✓ Docker 容器更新成功
    )
)

REM 更新后端
if exist "backend" (
    set /p UPDATE_BACKEND="是否更新后端依赖？(y/n): "
    if /i "%UPDATE_BACKEND%"=="y" (
        echo.
        echo 📦 更新后端依赖...
        cd backend
        pip install -r requirements.txt --upgrade
        cd ..
        echo ✓ 后端依赖更新完成
    )
)

REM 更新前端
if exist "frontend" (
    set /p UPDATE_FRONTEND="是否更新前端依赖？(y/n): "
    if /i "%UPDATE_FRONTEND%"=="y" (
        echo.
        echo 📦 更新前端依赖...
        cd frontend
        call npm install
        call npm run build
        cd ..
        echo ✓ 前端依赖更新完成
    )
)

echo.
echo ======================================
echo         更新完成！
echo ======================================
echo.
echo 💡 接下来：
echo    - 如果使用 Docker，容器已重启
echo    - 如果使用云平台，它们通常会自动检测并重新部署
echo.
echo 🔍 验证更新：
echo    - 访问前端查看是否正常
echo    - 检查后端 API 健康状态
echo    - 测试主要功能
echo.

pause

