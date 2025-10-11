#!/bin/bash

# 更新部署脚本
# 用于更新已部署的应用

echo "======================================"
echo "   AI 写作助手 - 更新部署脚本"
echo "======================================"
echo ""

# 检查 git
if ! command -v git &> /dev/null; then
    echo "❌ 错误：未检测到 Git"
    exit 1
fi

echo "📥 拉取最新代码..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ 代码拉取失败"
    exit 1
fi

echo "✓ 代码更新成功"
echo ""

# 检查是否使用 Docker
if [ -f "docker-compose.yml" ]; then
    read -p "检测到 Docker 配置，是否重新构建并重启？(y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "🔄 重新构建和重启 Docker 容器..."
        docker-compose down
        docker-compose up -d --build
        
        if [ $? -eq 0 ]; then
            echo "✓ Docker 容器更新成功"
        else
            echo "❌ Docker 更新失败"
            exit 1
        fi
    fi
fi

# 更新后端
if [ -d "backend" ]; then
    read -p "是否更新后端依赖？(y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "📦 更新后端依赖..."
        cd backend
        pip install -r requirements.txt --upgrade
        cd ..
        echo "✓ 后端依赖更新完成"
    fi
fi

# 更新前端
if [ -d "frontend" ]; then
    read -p "是否更新前端依赖？(y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "📦 更新前端依赖..."
        cd frontend
        npm install
        npm run build
        cd ..
        echo "✓ 前端依赖更新完成"
    fi
fi

echo ""
echo "======================================"
echo "         更新完成！"
echo "======================================"
echo ""
echo "💡 接下来："
echo "   - 如果使用 systemd，运行: sudo systemctl restart ai-writing-backend"
echo "   - 如果使用 Nginx，运行: sudo systemctl reload nginx"
echo "   - 如果使用云平台，它们通常会自动检测并重新部署"
echo ""
echo "🔍 验证更新："
echo "   - 访问前端查看是否正常"
echo "   - 检查后端 API 健康状态"
echo "   - 测试主要功能"
echo ""

