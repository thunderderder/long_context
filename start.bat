@echo off
chcp 65001 >nul
echo ====================================
echo    AI 写作助手 - 启动脚本
echo ====================================
echo.

:: 检查 Python 是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Python，请先安装 Python 3.8+
    pause
    exit /b 1
)

:: 检查 Node.js 是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js 16+
    pause
    exit /b 1
)

:: 检查环境变量
if "%DEEPSEEK_API_KEY%"=="" (
    echo [警告] 未设置 DEEPSEEK_API_KEY 环境变量
    echo 请设置后再启动，或在 backend/app.py 中配置
    echo.
    echo 设置方法：
    echo   set DEEPSEEK_API_KEY=your-api-key-here
    echo.
    pause
)

echo [1/4] 检查后端依赖...
cd backend
if not exist "venv" (
    echo     创建虚拟环境...
    python -m venv venv
)

call venv\Scripts\activate.bat
pip install -q -r requirements.txt
if errorlevel 1 (
    echo [错误] 后端依赖安装失败
    pause
    exit /b 1
)

echo [2/4] 启动后端服务...
start "AI写作助手 - 后端" cmd /k "cd /d %cd% && call venv\Scripts\activate.bat && python app.py"
cd ..

timeout /t 3 /nobreak >nul

echo [3/4] 检查前端依赖...
cd frontend
if not exist "node_modules" (
    echo     安装前端依赖（首次运行需要几分钟）...
    call npm install
    if errorlevel 1 (
        echo [错误] 前端依赖安装失败
        pause
        exit /b 1
    )
)

echo [4/4] 启动前端服务...
start "AI写作助手 - 前端" cmd /k "cd /d %cd% && npm start"
cd ..

echo.
echo ====================================
echo    启动完成！
echo ====================================
echo.
echo 后端服务: http://localhost:5000
echo 前端服务: http://localhost:3000
echo.
echo 浏览器将自动打开前端页面
echo 关闭窗口将停止相应服务
echo.
pause

