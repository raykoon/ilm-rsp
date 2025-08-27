# 多阶段构建 - 基础Python环境
FROM python:3.9-slim AS python-base

# 设置Python环境变量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgtk-3-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 创建工作目录
WORKDIR /app

# 开发阶段 - 安装开发依赖
FROM python-base AS development

# 安装额外的开发工具
RUN apt-get update && apt-get install -y \
    git \
    vim \
    htop \
    && rm -rf /var/lib/apt/lists/*

# 复制requirements文件并安装Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 创建必要的目录
RUN mkdir -p /app/uploads /app/models /app/reports /app/templates /app/logs

# 设置权限
RUN chmod +x /app/main.py

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 启动命令
CMD ["python", "main.py"]

# 生产阶段 - 优化的生产镜像
FROM python-base AS production

# 创建非root用户
RUN groupadd -r aiservice && useradd -r -g aiservice aiservice

# 安装生产依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install gunicorn==21.2.0

# 复制应用代码
COPY --chown=aiservice:aiservice . .

# 创建必要的目录
RUN mkdir -p /app/uploads /app/models /app/reports /app/templates /app/logs \
    && chown -R aiservice:aiservice /app

# 切换到非root用户
USER aiservice

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 生产启动命令
CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "--timeout", "300", "--keep-alive", "2", "--max-requests", "1000", "--max-requests-jitter", "100"]

# GPU版本 - 支持CUDA的版本
FROM nvidia/cuda:11.8-runtime-ubuntu20.04 AS gpu-production

# 安装Python 3.9
RUN apt-get update && apt-get install -y \
    software-properties-common \
    && add-apt-repository ppa:deadsnakes/ppa \
    && apt-get update \
    && apt-get install -y \
    python3.9 \
    python3.9-pip \
    python3.9-dev \
    gcc \
    g++ \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgl1-mesa-glx \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 设置Python别名
RUN ln -s /usr/bin/python3.9 /usr/bin/python && ln -s /usr/bin/pip3.9 /usr/bin/pip

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    DEVICE=cuda

# 创建非root用户
RUN groupadd -r aiservice && useradd -r -g aiservice aiservice

# 安装PyTorch GPU版本和其他依赖
COPY requirements.txt .
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cu118 \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install gunicorn==21.2.0

# 复制应用代码
COPY --chown=aiservice:aiservice . .

# 创建必要的目录
RUN mkdir -p /app/uploads /app/models /app/reports /app/templates /app/logs \
    && chown -R aiservice:aiservice /app

# 切换到非root用户
USER aiservice

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# GPU生产启动命令
CMD ["gunicorn", "main:app", "-w", "2", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000", "--timeout", "600", "--keep-alive", "2", "--max-requests", "500", "--max-requests-jitter", "50"]
