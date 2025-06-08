# Offer Land - 轻量级论坛网站

一个类似一亩三分地的轻量级论坛网站，支持用户注册、登录、发帖、回帖和私信功能。

## 功能特性

- 🔐 用户注册/登录（基于邮箱）
- 📝 发布帖子和回复
- 💬 私信功能
- 🔍 帖子搜索和分类
- 👤 用户个人资料
- 📱 响应式设计
- 🎨 现代化UI界面

## 技术栈

### 后端
- Node.js + Express
- MongoDB + Mongoose
- JWT 身份验证
- Socket.io 实时通信
- bcryptjs 密码加密

### 前端
- React 18 + TypeScript
- Ant Design UI组件库
- React Router 路由管理
- Axios HTTP客户端
- Socket.io-client 实时通信

## 快速开始

### 环境要求
- Node.js 16+
- MongoDB 4.4+
- npm 或 yarn

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd offer-land
```

2. 安装依赖
```bash
npm run install-all
```

3. 配置环境变量
```bash
cp env.example .env
```
编辑 `.env` 文件，配置数据库连接和JWT密钥：
```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/offer-land
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
```

4. 启动MongoDB服务
```bash
# macOS (使用 Homebrew)
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Windows
net start MongoDB
```

5. 启动开发服务器
```bash
npm run dev
```

这将同时启动后端服务器（端口5001）和前端开发服务器（端口3000）。

### 单独启动服务

启动后端服务器：
```bash
npm run server
```

启动前端开发服务器：
```bash
npm run client
```

## 🚀 部署指南

### 方案1：Docker 部署（推荐）

#### 本地 Docker 部署
```bash
# 1. 确保安装了 Docker 和 Docker Compose
docker --version
docker-compose --version

# 2. 构建并启动服务
docker-compose up --build -d

# 3. 访问应用
# 前端: http://localhost
# API: http://localhost/api
```

#### 使用部署脚本
```bash
# 运行自动部署脚本
./deploy.sh
```

### 方案2：Railway 部署

1. 注册 [Railway](https://railway.app) 账号
2. 连接你的 GitHub 仓库
3. 添加 MongoDB 服务：
   ```bash
   railway add mongodb
   ```
4. 设置环境变量：
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secret-key`
   - `MONGODB_URI=<railway-mongodb-url>`
5. 部署应用

### 方案3：Vercel + MongoDB Atlas

#### 前端部署到 Vercel
1. 注册 [Vercel](https://vercel.com) 账号
2. 连接 GitHub 仓库
3. 设置构建命令：
   ```bash
   cd client && npm run build
   ```

#### 后端部署
可以选择：
- Railway
- Heroku
- DigitalOcean App Platform
- AWS Elastic Beanstalk

#### 数据库使用 MongoDB Atlas
1. 注册 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. 创建免费集群
3. 获取连接字符串
4. 在部署平台设置环境变量

### 方案4：云服务器部署

#### 准备工作
1. 购买云服务器（阿里云、腾讯云、AWS等）
2. 安装 Docker 和 Docker Compose
3. 配置域名和SSL证书

#### 部署步骤
```bash
# 1. 连接服务器
ssh user@your-server-ip

# 2. 克隆项目
git clone <your-repo-url>
cd offer-land

# 3. 配置环境变量
cp production.env .env
# 编辑 .env 文件，设置生产环境配置

# 4. 启动服务
docker-compose up -d

# 5. 配置 Nginx（如果需要）
# 设置域名、SSL证书等
```

## 环境变量配置

### 开发环境 (.env)
```bash
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://localhost:27017/offer-land
JWT_SECRET=your-development-secret
```

### 生产环境
```bash
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb://username:password@host:port/database
JWT_SECRET=your-very-secure-production-secret-key
```

## 项目结构

```
offer-land/
├── server/                 # 后端代码
│   ├── models/            # 数据模型
│   ├── routes/            # API路由
│   ├── middleware/        # 中间件
│   └── index.js          # 服务器入口
├── client/                # 前端代码
│   ├── src/
│   │   ├── components/    # React组件
│   │   ├── pages/         # 页面组件
│   │   ├── contexts/      # React Context
│   │   ├── services/      # API服务
│   │   └── types/         # TypeScript类型
│   └── public/
├── Dockerfile             # Docker配置
├── docker-compose.yml     # Docker Compose配置
├── nginx.conf            # Nginx配置
├── deploy.sh             # 部署脚本
├── package.json          # 项目配置
└── README.md
```

## API接口

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 帖子相关
- `GET /api/posts` - 获取帖子列表
- `GET /api/posts/:id` - 获取帖子详情
- `POST /api/posts` - 创建帖子
- `POST /api/posts/:id/replies` - 添加回复
- `POST /api/posts/:id/like` - 点赞/取消点赞

### 私信相关
- `GET /api/messages/conversations` - 获取对话列表
- `GET /api/messages/:userId` - 获取与特定用户的消息
- `POST /api/messages` - 发送消息
- `GET /api/messages/unread/count` - 获取未读消息数量

### 用户相关
- `GET /api/users/:id` - 获取用户资料
- `PUT /api/users/profile` - 更新个人资料
- `GET /api/users` - 搜索用户

## 监控和维护

### 查看日志
```bash
# Docker 部署
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f app
docker-compose logs -f mongodb
```

### 备份数据库
```bash
# MongoDB 备份
docker exec offer-land-db mongodump --out /backup
docker cp offer-land-db:/backup ./backup
```

### 更新应用
```bash
# 拉取最新代码
git pull

# 重新构建并部署
docker-compose up --build -d
```

## 性能优化

1. **数据库优化**
   - 添加索引
   - 使用连接池
   - 数据分页

2. **缓存策略**
   - Redis 缓存
   - CDN 加速
   - 浏览器缓存

3. **服务器优化**
   - 负载均衡
   - 水平扩展
   - 监控告警

## 安全考虑

1. **环境变量**
   - 使用强密码
   - 定期更换密钥
   - 不要提交敏感信息到代码库

2. **数据库安全**
   - 启用认证
   - 限制网络访问
   - 定期备份

3. **应用安全**
   - 输入验证
   - SQL注入防护
   - XSS防护

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License 