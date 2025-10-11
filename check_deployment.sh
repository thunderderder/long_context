#!/bin/bash

# 部署检查脚本
# 用于检查部署是否成功

echo "======================================"
echo "     AI 写作助手 - 部署检查工具"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_service() {
    local url=$1
    local name=$2
    
    echo -n "检查 $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null)
    
    if [ "$response" == "200" ]; then
        echo -e "${GREEN}✓ 正常${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}✗ 失败${NC} (HTTP $response)"
        return 1
    fi
}

# 如果提供了参数，使用参数作为 URL
if [ $# -eq 2 ]; then
    BACKEND_URL=$1
    FRONTEND_URL=$2
else
    # 提示用户输入 URL
    read -p "请输入后端 URL (例如: https://your-backend.railway.app): " BACKEND_URL
    read -p "请输入前端 URL (例如: https://your-app.vercel.app): " FRONTEND_URL
fi

echo ""
echo "正在检查服务状态..."
echo ""

# 检查后端健康
check_service "${BACKEND_URL}/api/health" "后端健康检查"
backend_status=$?

# 检查前端
check_service "${FRONTEND_URL}" "前端服务"
frontend_status=$?

echo ""
echo "======================================"
echo "           检查结果汇总"
echo "======================================"
echo ""

if [ $backend_status -eq 0 ] && [ $frontend_status -eq 0 ]; then
    echo -e "${GREEN}✓ 所有服务运行正常！${NC}"
    echo ""
    echo "🎉 恭喜！你的应用已成功部署！"
    echo ""
    echo "📱 访问地址: $FRONTEND_URL"
    echo "🔧 API 地址: $BACKEND_URL"
    echo ""
else
    echo -e "${RED}✗ 部分服务异常${NC}"
    echo ""
    echo "请检查："
    [ $backend_status -ne 0 ] && echo "  - 后端服务是否正常启动"
    [ $backend_status -ne 0 ] && echo "  - 环境变量是否正确配置"
    [ $frontend_status -ne 0 ] && echo "  - 前端构建是否成功"
    [ $frontend_status -ne 0 ] && echo "  - 域名解析是否正确"
    echo ""
    echo "查看详细日志获取更多信息"
    echo ""
fi

# 性能测试（可选）
echo "======================================"
echo "           性能测试"
echo "======================================"
echo ""

if [ $frontend_status -eq 0 ]; then
    echo "测试前端加载速度..."
    
    start_time=$(date +%s%N)
    curl -s -o /dev/null "$FRONTEND_URL"
    end_time=$(date +%s%N)
    
    duration=$((($end_time - $start_time) / 1000000))
    
    echo "前端加载时间: ${duration}ms"
    
    if [ $duration -lt 2000 ]; then
        echo -e "${GREEN}✓ 加载速度优秀${NC}"
    elif [ $duration -lt 5000 ]; then
        echo -e "${YELLOW}⚠ 加载速度一般${NC}"
    else
        echo -e "${RED}✗ 加载速度较慢，建议优化${NC}"
    fi
fi

echo ""
echo "检查完成！"
echo ""

