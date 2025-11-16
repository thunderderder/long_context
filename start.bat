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

:: 检查 API Key 配置
set API_KEY_FOUND=0

:: 检查系统环境变量
if not "%DEEPSEEK_API_KEY%"=="" (
    set API_KEY_FOUND=1
)

:: 检查 .env 文件
if exist "backend\.env" (
    findstr /C:"DEEPSEEK_API_KEY=" backend\.env | findstr /V /C:"your-api-key-here" >nul 2>&1
    if not errorlevel 1 (
        set API_KEY_FOUND=1
    )
)

if %API_KEY_FOUND%==0 (
    echo [警告] 未检测到 DEEPSEEK_API_KEY 配置
    echo.
    echo 请选择以下任一方式配置：
    echo   方式1：编辑 backend\.env 文件，设置 DEEPSEEK_API_KEY
    echo   方式2：设置系统环境变量 set DEEPSEEK_API_KEY=your-api-key-here
    echo.
    echo 获取 API Key: https://platform.deepseek.com/
    echo.
    pause
    exit /b 1
) else (
    echo [✓] API Key 配置已检测到
)

echo [1/4] 检查后端依赖...
cd backend

:: 检测环境类型
set USE_CONDA=0
set VENV_PATH=
set CONDA_ENV_NAME=long_context

:: 检测是否有 conda
conda --version >nul 2>&1
if not errorlevel 1 (
    :: 检测 conda 环境是否存在
    conda env list | findstr /C:"%CONDA_ENV_NAME%" >nul 2>&1
    if not errorlevel 1 (
        set USE_CONDA=1
        echo     使用 Conda 环境: %CONDA_ENV_NAME%
    )
)

:: 如果不使用 conda，检测 venv
if %USE_CONDA%==0 (
    if exist "long_context\Scripts\activate.bat" (
        set VENV_PATH=long_context
        echo     使用虚拟环境: long_context
    ) else if exist "venv\Scripts\activate.bat" (
        set VENV_PATH=venv
        echo     使用虚拟环境: venv
    ) else if exist ".venv\Scripts\activate.bat" (
        set VENV_PATH=.venv
        echo     使用虚拟环境: .venv
    ) else (
        echo     创建虚拟环境...
        python -m venv venv
        set VENV_PATH=venv
    )
    call %VENV_PATH%\Scripts\activate.bat
) else (
    call conda activate %CONDA_ENV_NAME%
)

pip install -q -r requirements.txt
if errorlevel 1 (
    echo [错误] 后端依赖安装失败
    pause
    exit /b 1
)

echo [2/4] 启动后端服务...
if %USE_CONDA%==1 (
    start "AI写作助手 - 后端" cmd /k "cd /d %cd% && conda activate %CONDA_ENV_NAME% && python app.py"
) else (
    start "AI写作助手 - 后端" cmd /k "cd /d %cd% && call %VENV_PATH%\Scripts\activate.bat && python app.py"
)
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

