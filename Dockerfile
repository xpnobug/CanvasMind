# ==================== Stage 1: 依赖安装 ====================
FROM node:20-alpine AS deps

# 设置工作目录。
WORKDIR /app

# 复制依赖声明文件。
COPY package.json package-lock.json ./

# 安装完整依赖，运行时仍需使用 tsx。
RUN npm ci

# ==================== Stage 2: 构建产物 ====================
FROM node:20-alpine AS builder

# 设置工作目录。
WORKDIR /app

# 复制依赖目录。
COPY --from=deps /app/node_modules ./node_modules

# 复制项目源码。
COPY . .

# 执行前端构建。
RUN npm run build

# ==================== Stage 3: 生产运行 ====================
FROM node:20-alpine AS runner

# 设置工作目录。
WORKDIR /app

# 声明生产环境。
ENV NODE_ENV=production

# 复制依赖、构建产物与运行所需源码。
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/.env.production ./.env.production

# 创建上传目录，供本地媒体资源持久化使用。
RUN mkdir -p /app/uploads

# 暴露统一应用端口。
EXPOSE 5409

# 启动完整生产应用，先迁移数据库，再启动统一服务。
CMD ["npm", "run", "start"]
