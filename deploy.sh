#!/bin/bash

echo "🚀 开始部署 Offer Land 论坛..."

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 停止现有容器
echo "🛑 停止现有容器..."
docker compose down

# 构建并启动服务
echo "🔨 构建并启动服务..."
docker compose up --build -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."
docker compose ps

# 测试应用是否正常运行
echo "🧪 测试应用..."
if curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "✅ 应用部署成功！"
    echo "🌐 访问地址: http://localhost"
    echo "📊 管理面板: docker compose logs -f"
else
    echo "❌ 应用启动失败，请检查日志: docker compose logs"
    exit 1
fi

echo "🎉 部署完成！" 