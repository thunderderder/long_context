#!/bin/bash

echo "===================================="
echo "   AI 写作助手 - 启动脚本"
echo "===================================="
echo ""

# 检查 Python 是否安装
if ! command -v python3 &> /dev/null; then
    echo "[错误] 未检测到 Python，请先安装 Python 3.8+"
    exit 1
fi

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js 16+"
    exit 1
fi

# 检查环境变量
if [ -z "$DEEPSEEK_API_KEY" ]; then
    echo "[警告] 未设置 DEEPSEEK_API_KEY 环境变量"
    echo "请设置后再启动，或在 backend/app.py 中配置"
    echo ""
    echo "设置方法："
    echo "  export DEEPSEEK_API_KEY=your-api-key-here"
    echo ""
    read -p "按回车继续..."
fi

echo "[1/4] 检查后端依赖..."
cd backend

if [ ! -d "venv" ]; then
    echo "    创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[错误] 后端依赖安装失败"
    exit 1
fi

echo "[2/4] 启动后端服务..."
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "cd $(pwd) && source venv/bin/activate && python app.py; exec bash"
elif command -v xterm &> /dev/null; then
    xterm -e "cd $(pwd) && source venv/bin/activate && python app.py; exec bash" &
else
    python app.py &
    BACKEND_PID=$!
fi

cd ..
sleep 3

echo "[3/4] 检查前端依赖..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "    安装前端依赖（首次运行需要几分钟）..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[错误] 前端依赖安装失败"
        exit 1
    fi
fi

echo "[4/4] 启动前端服务..."
if command -v gnome-terminal &> /dev/null; then
    gnome-terminal -- bash -c "cd $(pwd) && npm start; exec bash"
elif command -v xterm &> /dev/null; then
    xterm -e "cd $(pwd) && npm start; exec bash" &
else
    npm start &
    FRONTEND_PID=$!
fi

cd ..

echo ""
echo "===================================="
echo "   启动完成！"
echo "===================================="
echo ""
echo "后端服务: http://localhost:5000"
echo "前端服务: http://localhost:3000"
echo ""
echo "浏览器将自动打开前端页面"
echo ""

# 等待用户按键
read -p "按回车退出..."

