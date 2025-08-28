# 多阶段构建 - Node.js后端服务
FROM node:18-alpine AS base

# 安装系统依赖
RUN apk add --no-cache libc6-compat

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 开发阶段
FROM base AS development
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

# 构建阶段
FROM base AS builder
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production
RUN apk add --no-cache dumb-init

# 创建非root用户
RUN addgroup --gid 1001 --system nodejs
RUN adduser --system backend --uid 1001

WORKDIR /app

# 复制package文件并安装生产依赖
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

# 复制构建产物
COPY --from=builder --chown=backend:nodejs /app/dist ./dist
COPY --from=builder --chown=backend:nodejs /app/prisma ./prisma
COPY --from=builder --chown=backend:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# 创建日志目录
RUN mkdir -p /app/logs && chown backend:nodejs /app/logs

USER backend

EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.js"]
