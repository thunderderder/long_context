@echo off
setlocal enabledelayedexpansion

REM 将输出重定向到日志文件，同时也显示在屏幕上
set "LOGFILE=%~dp0frontend_start.log"
echo. > "%LOGFILE%"

call :log "=================================="
call :log "前端启动脚本 - 开始执行"
call :log "时间: %date% %time%"
call :log "=================================="
call :log ""

REM 显示当前目录
call :log "当前目录: %CD%"
call :log "脚本目录: %~dp0"
call :log ""

REM 检查 Node.js 是否安装
call :log "检查 Node.js..."
where node >nul 2>&1
if !errorlevel! neq 0 (
    call :log "[错误] Node.js 未安装或未在 PATH 环境变量中！"
    call :log "请先安装 Node.js: https://nodejs.org/"
    call :log ""
    call :log "按任意键退出..."
    pause >nul
    exit /b 1
)
call :log "[OK] Node.js 已安装"

REM 检查 npm 是否安装
call :log "检查 npm..."
where npm >nul 2>&1
if !errorlevel! neq 0 (
    call :log "[错误] npm 未安装或未在 PATH 环境变量中！"
    call :log "请先安装 Node.js (包含 npm): https://nodejs.org/"
    call :log ""
    call :log "按任意键退出..."
    pause >nul
    exit /b 1
)
call :log "[OK] npm 已安装"
call :log ""

REM 显示版本信息
call :log "Node.js 版本:"
node --version >> "%LOGFILE%" 2>&1
node --version
call :log "npm 版本:"
npm --version >> "%LOGFILE%" 2>&1
npm --version
call :log ""

REM 检查 frontend 目录是否存在
call :log "检查 frontend 目录..."
if not exist "frontend" (
    call :log "[错误] frontend 目录不存在！"
    call :log "当前目录: %CD%"
    call :log "请确保在项目根目录下运行此脚本。"
    call :log ""
    call :log "目录内容:"
    dir /b >> "%LOGFILE%"
    dir /b
    call :log ""
    call :log "按任意键退出..."
    pause >nul
    exit /b 1
)
call :log "[OK] frontend 目录存在"
call :log ""

call :log "切换到 frontend 目录..."
cd frontend
call :log "当前目录: %CD%"
call :log ""

REM 检查 package.json 是否存在
if not exist "package.json" (
    call :log "[错误] package.json 不存在！"
    call :log "frontend 目录可能不完整。"
    call :log ""
    call :log "按任意键退出..."
    pause >nul
    exit /b 1
)
call :log "[OK] package.json 存在"
call :log ""

REM 检查 node_modules 是否存在
call :log "检查依赖..."
if not exist "node_modules" (
    call :log "[警告] node_modules 目录不存在！"
    call :log "正在安装依赖，这可能需要几分钟..."
    call :log ""
    npm install
    if !errorlevel! neq 0 (
        call :log ""
        call :log "[错误] 依赖安装失败！错误代码: !errorlevel!"
        call :log "请查看上面的错误信息。"
        call :log ""
        call :log "按任意键退出..."
        pause >nul
        exit /b 1
    )
    call :log ""
    call :log "[OK] 依赖安装完成！"
    call :log ""
) else (
    call :log "[OK] node_modules 已存在"
    call :log ""
)

call :log "=================================="
call :log "启动前端开发服务器..."
call :log "=================================="
call :log "提示: 按 Ctrl+C 可以停止服务器"
call :log ""
call :log "如果浏览器没有自动打开，请访问: http://localhost:3000"
call :log ""

npm start

REM 如果 npm start 退出，显示错误信息
if !errorlevel! neq 0 (
    call :log ""
    call :log "=================================="
    call :log "[错误] 前端启动失败！"
    call :log "错误代码: !errorlevel!"
    call :log "=================================="
    call :log ""
)

call :log ""
call :log "按任意键退出..."
pause >nul
exit /b !errorlevel!

REM 日志函数
:log
echo %~1
echo %~1 >> "%LOGFILE%"
goto :eof

