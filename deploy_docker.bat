@echo off
chcp 65001 >nul
echo ========================================
echo     AI 写作助手 - Docker 部署脚本
echo ========================================
echo.

REM 检查 Docker 是否安装
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未检测到 Docker！
    echo 请先安装 Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✓ 检测到 Docker

REM 检查 .env 文件
if not exist ".env" (
    echo.
    echo ⚠️  未找到 .env 文件，正在创建...
    copy .env.example .env >nul 2>&1
    echo.
    echo ⚠️  请编辑 .env 文件，设置你的 DEEPSEEK_API_KEY
    echo    文件位置: %cd%\.env
    echo.
    pause
    notepad .env
)

echo.
echo 🚀 开始构建和启动容器...
echo.

docker-compose up -d --build

if errorlevel 1 (
    echo.
    echo ❌ 部署失败！请检查错误信息。
    pause
    exit /b 1
)

echo.
echo ========================================
echo           部署成功！✨
echo ========================================
echo.
echo 📱 前端访问地址: http://localhost
echo 🔧 后端 API 地址: http://localhost:8000
echo 📊 健康检查: http://localhost:8000/api/health
echo.
echo 💡 常用命令:
echo    查看日志: docker-compose logs -f
echo    停止服务: docker-compose stop
echo    重启服务: docker-compose restart
echo    停止并删除: docker-compose down
echo.

REM 等待服务启动
timeout /t 3 /nobreak >nul

REM 打开浏览器
start http://localhost

pause

