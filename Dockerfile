# ==================== Stage 1: 依赖安装 ====================
FROM node:22-bookworm-slim AS deps

# 设置工作目录。
WORKDIR /app

# 复制依赖声明文件。
COPY package.json ./

# 安装构建阶段所需依赖。
# 额外补装前端构建链路中的 Linux 原生包，规避 npm 漏装 optionalDependencies 的问题。
RUN set -eux; \
  npm install --include=dev --no-fund --no-audit; \
  ARCH="$(dpkg --print-architecture)"; \
  if [ "$ARCH" = "amd64" ]; then \
    ROLLUP_PACKAGE='@rollup/rollup-linux-x64-gnu@4.56.0'; \
    LIGHTNINGCSS_PACKAGE='lightningcss-linux-x64-gnu@1.30.2'; \
    TAILWIND_PACKAGE='@tailwindcss/oxide-linux-x64-gnu@4.1.18'; \
  elif [ "$ARCH" = "arm64" ]; then \
    ROLLUP_PACKAGE='@rollup/rollup-linux-arm64-gnu@4.56.0'; \
    LIGHTNINGCSS_PACKAGE='lightningcss-linux-arm64-gnu@1.30.2'; \
    TAILWIND_PACKAGE='@tailwindcss/oxide-linux-arm64-gnu@4.1.18'; \
  else \
    echo "不支持的 Docker 构建架构: $ARCH"; \
    exit 1; \
  fi; \
  npm install "$ROLLUP_PACKAGE" "$LIGHTNINGCSS_PACKAGE" "$TAILWIND_PACKAGE" --no-save --no-fund --no-audit

# ==================== Stage 2: 构建产物 ====================
FROM node:22-bookworm-slim AS builder

# 设置工作目录。
WORKDIR /app

# 接收前端构建期变量。
ARG VITE_API_BASE_URL=
ARG VITE_PROVIDER_DEFAULT_BASE_URL=https://api.chatfire.site/v1

# 将前端构建变量注入到 Vite 构建环境。
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
  VITE_PROVIDER_DEFAULT_BASE_URL=${VITE_PROVIDER_DEFAULT_BASE_URL}

# 复制依赖目录。
COPY --from=deps /app/node_modules ./node_modules

# 复制项目源码。
COPY . .

# 构建前端静态资源。
RUN npm run build:client

# 构建后端独立服务运行包。
RUN node scripts/build-server-service.mjs

# ==================== Stage 3: 生产运行 ====================
FROM node:22-bookworm-slim AS runner

# 设置工作目录。
WORKDIR /app

# 声明生产环境与默认运行目录。
ENV NODE_ENV=production \
  SERVER_PORT=5409 \
  STATIC_DIST_DIR=/app/dist \
  UPLOADS_DIR=/app/uploads

# 复制前端静态资源与后端独立服务包。
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-service/ ./

# 安装后端运行时依赖，并补齐 Prisma 所需的 OpenSSL 运行库。
# 同时显式生成 Prisma Client，确保运行时能正确导出 PrismaClient。
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && npm install --omit=dev --no-fund --no-audit \
  && DATABASE_URL='mysql://root:placeholder@127.0.0.1:3306/canana_mind' npx prisma generate

# 创建上传目录，供本地媒体资源持久化使用。
RUN mkdir -p /app/uploads

# 暴露统一应用端口。
EXPOSE 5409

# 启动完整生产应用，先迁移数据库，再启动统一服务。
CMD ["npm", "run", "start"]
