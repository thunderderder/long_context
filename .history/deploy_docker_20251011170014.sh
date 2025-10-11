#!/bin/bash

echo "========================================"
echo "   AI 写作助手 - Docker 部署脚本"
echo "========================================"
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误：未检测到 Docker！"
    echo "请先安装 Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

echo "✓ 检测到 Docker"

# 检查 docker-compose 是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ 错误：未检测到 docker-compose！"
    echo "请先安装 docker-compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✓ 检测到 docker-compose"

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  未找到 .env 文件，正在创建..."
    cp .env.example .env
    echo ""
    echo "⚠️  请编辑 .env 文件，设置你的 DEEPSEEK_API_KEY"
    echo "   文件位置: $(pwd)/.env"
    echo ""
    read -p "按回车键继续编辑 .env 文件..." 
    ${EDITOR:-nano} .env
fi

echo ""
echo "🚀 开始构建和启动容器..."
echo ""

docker-compose up -d --build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ 部署失败！请检查错误信息。"
    exit 1
fi

echo ""
echo "========================================"
echo "         部署成功！✨"
echo "========================================"
echo ""
echo "📱 前端访问地址: http://localhost"
echo "🔧 后端 API 地址: http://localhost:8000"
echo "📊 健康检查: http://localhost:8000/api/health"
echo ""
echo "💡 常用命令:"
echo "   查看日志: docker-compose logs -f"
echo "   停止服务: docker-compose stop"
echo "   重启服务: docker-compose restart"
echo "   停止并删除: docker-compose down"
echo ""

# 等待服务启动
sleep 3

# 尝试打开浏览器（仅在桌面环境下）
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost
elif command -v open &> /dev/null; then
    open http://localhost
fi

