@echo off
echo Starting AI Writing Assistant Frontend...
echo.

REM 检查 Node.js 是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] Node.js 未安装或未在 PATH 环境变量中！
    echo 请先安装 Node.js: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM 检查 npm 是否安装
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] npm 未安装或未在 PATH 环境变量中！
    echo 请先安装 Node.js (包含 npm): https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js 版本:
node --version
echo npm 版本:
npm --version
echo.

REM 检查 frontend 目录是否存在
if not exist "frontend" (
    echo [错误] frontend 目录不存在！
    echo 当前目录: %CD%
    echo 请确保在项目根目录下运行此脚本。
    echo.
    pause
    exit /b 1
)

echo 切换到 frontend 目录...
cd frontend

REM 检查 node_modules 是否存在
if not exist "node_modules" (
    echo [警告] node_modules 目录不存在！
    echo 正在安装依赖...
    echo.
    npm install
    if %errorlevel% neq 0 (
        echo [错误] 依赖安装失败！
        echo.
        pause
        exit /b 1
    )
    echo.
    echo 依赖安装完成！
    echo.
)

echo 启动前端开发服务器...
echo.
npm start

REM 如果 npm start 退出，显示错误信息
if %errorlevel% neq 0 (
    echo.
    echo [错误] 前端启动失败！错误代码: %errorlevel%
    echo.
)

pause

