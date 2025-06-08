# 🚀 Offer Land 部署指南

本指南将帮助你将 Offer Land 论坛部署到不同的环境中。

## 📋 部署前准备

### 1. 环境要求
- Node.js 18+
- Docker & Docker Compose（推荐）
- MongoDB（如果不使用 Docker）

### 2. 配置环境变量
复制并编辑环境配置文件：
```bash
cp production.env .env
```

编辑 `.env` 文件，设置以下变量：
```bash
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://admin:password123@mongodb:27017/offer-land?authSource=admin
JWT_SECRET=your-very-secure-production-secret-key-make-it-long-and-random
```

## 🐳 方案1：Docker 部署（推荐）

### 步骤1：启动 Docker Desktop
确保 Docker Desktop 正在运行。

### 步骤2：简化部署
```bash
# 使用简化配置部署
docker compose -f docker-compose.simple.yml up --build -d

# 查看服务状态
docker compose -f docker-compose.simple.yml ps

# 查看日志
docker compose -f docker-compose.simple.yml logs -f
```

### 步骤3：访问应用
- 应用地址：http://localhost:5001
- 数据库：localhost:27017

### 管理命令
```bash
# 停止服务
docker compose -f docker-compose.simple.yml down

# 重启服务
docker compose -f docker-compose.simple.yml restart

# 查看日志
docker compose -f docker-compose.simple.yml logs app
docker compose -f docker-compose.simple.yml logs mongodb

# 备份数据库
docker exec offer-land-db mongodump --out /backup
docker cp offer-land-db:/backup ./backup
```

## 🌐 方案2：Railway 部署

Railway 是一个简单易用的云平台，非常适合快速部署。

### 步骤1：准备代码
1. 将代码推送到 GitHub
2. 确保 `railway.json` 配置文件存在

### 步骤2：部署到 Railway
1. 访问 [Railway](https://railway.app)
2. 使用 GitHub 账号登录
3. 点击 "New Project" → "Deploy from GitHub repo"
4. 选择你的仓库

### 步骤3：添加数据库
1. 在项目中点击 "Add Service"
2. 选择 "Database" → "MongoDB"
3. Railway 会自动创建 MongoDB 实例

### 步骤4：配置环境变量
在 Railway 项目设置中添加：
```
NODE_ENV=production
JWT_SECRET=your-secure-secret-key
MONGODB_URI=<railway-will-provide-this>
```

### 步骤5：部署
Railway 会自动检测到 Node.js 项目并开始部署。

## ☁️ 方案3：Vercel + MongoDB Atlas

### 前端部署到 Vercel
1. 访问 [Vercel](https://vercel.com)
2. 连接 GitHub 仓库
3. 设置构建配置：
   - Build Command: `cd client && npm run build`
   - Output Directory: `client/build`

### 后端部署
可以选择以下平台之一：
- **Railway**（推荐）
- **Heroku**
- **DigitalOcean App Platform**
- **AWS Elastic Beanstalk**

### 数据库使用 MongoDB Atlas
1. 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 创建免费集群
3. 获取连接字符串
4. 在后端部署平台设置环境变量

## 🖥️ 方案4：传统服务器部署

### 步骤1：服务器准备
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# 启动 MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# 安装 PM2（进程管理器）
sudo npm install -g pm2
```

### 步骤2：部署应用
```bash
# 克隆代码
git clone <your-repo-url>
cd offer-land

# 安装依赖
npm install
cd client && npm install && npm run build && cd ..

# 配置环境变量
cp production.env .env
# 编辑 .env 文件

# 使用 PM2 启动应用
pm2 start server/index.js --name "offer-land"
pm2 startup
pm2 save
```

### 步骤3：配置 Nginx（可选）
```bash
# 安装 Nginx
sudo apt install nginx

# 创建配置文件
sudo nano /etc/nginx/sites-available/offer-land
```

Nginx 配置内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/offer-land /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 🔧 本地开发部署测试

如果你想在本地测试生产环境：

### 方法1：使用 Docker（推荐）
```bash
# 构建前端
cd client && npm run build && cd ..

# 启动 Docker 服务
docker compose -f docker-compose.simple.yml up --build
```

### 方法2：手动启动
```bash
# 确保 MongoDB 运行
brew services start mongodb-community

# 构建前端
cd client && npm run build && cd ..

# 设置生产环境变量
export NODE_ENV=production
export PORT=5001
export MONGODB_URI=mongodb://localhost:27017/offer-land
export JWT_SECRET=your-secret-key

# 启动应用
npm start
```

## 📊 监控和维护

### 查看应用状态
```bash
# Docker 部署
docker compose -f docker-compose.simple.yml ps
docker compose -f docker-compose.simple.yml logs -f

# PM2 部署
pm2 status
pm2 logs offer-land
pm2 monit
```

### 更新应用
```bash
# Docker 部署
git pull
docker compose -f docker-compose.simple.yml up --build -d

# PM2 部署
git pull
cd client && npm run build && cd ..
pm2 restart offer-land
```

### 备份数据库
```bash
# Docker 部署
docker exec offer-land-db mongodump --out /backup
docker cp offer-land-db:/backup ./backup

# 本地 MongoDB
mongodump --db offer-land --out ./backup
```

## 🔒 安全建议

1. **更改默认密码**
   - 数据库密码
   - JWT 密钥

2. **启用 HTTPS**
   - 使用 Let's Encrypt
   - 配置 SSL 证书

3. **防火墙配置**
   - 只开放必要端口
   - 限制数据库访问

4. **定期更新**
   - 系统更新
   - 依赖包更新
   - 安全补丁

## 🆘 故障排除

### 常见问题

1. **Docker 无法启动**
   ```bash
   # 检查 Docker 是否运行
   docker version
   
   # 重启 Docker Desktop
   ```

2. **数据库连接失败**
   ```bash
   # 检查 MongoDB 状态
   docker compose logs mongodb
   
   # 检查连接字符串
   echo $MONGODB_URI
   ```

3. **应用无法访问**
   ```bash
   # 检查端口是否被占用
   lsof -i :5001
   
   # 检查应用日志
   docker compose logs app
   ```

4. **前端页面空白**
   ```bash
   # 重新构建前端
   cd client && npm run build
   
   # 检查构建文件
   ls -la client/build
   ```

## 📞 获取帮助

如果遇到问题，可以：
1. 查看项目 Issues
2. 检查日志文件
3. 参考官方文档
4. 联系技术支持

---

选择最适合你的部署方案，开始部署你的 Offer Land 论坛吧！🎉 