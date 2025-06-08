# 使用官方 Node.js 运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制 package.json 文件
COPY package*.json ./

# 安装后端依赖
RUN npm install

# 复制后端源代码
COPY server/ ./server/

# 复制前端代码并构建
COPY client/package*.json ./client/
RUN cd client && npm install

COPY client/ ./client/
RUN cd client && npm run build

# 复制环境配置
COPY .env ./

# 暴露端口
EXPOSE 5001

# 启动应用
CMD ["npm", "start"] 