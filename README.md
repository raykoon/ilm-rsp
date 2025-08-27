# 儿童口腔快速筛查报告平台

## 项目概述

这是一个基于AI的儿童口腔快速筛查报告SaaS平台，旨在为门诊提供智能化的口腔筛查和报告生成服务。

## 技术架构

### 前端
- **框架**: React + Next.js 14
- **样式**: Tailwind CSS
- **组件库**: Ant Design / Shadcn UI
- **状态管理**: Zustand
- **HTTP客户端**: Axios

### 后端API服务
- **框架**: Node.js + Express
- **ORM**: Prisma
- **认证**: JWT
- **文件存储**: 本地存储 + 云端备份

### AI分析服务
- **语言**: Python
- **框架**: FastAPI
- **AI模型**: PyTorch / TensorFlow
- **图像处理**: OpenCV, PIL
- **医学影像**: DICOM处理

### 数据库
- **主数据库**: PostgreSQL
- **缓存**: Redis
- **文件存储**: MinIO / AWS S3

## 项目结构

```
ilm-rsp/
├── frontend/           # React + Next.js 前端应用
├── backend/            # Node.js API 服务
├── ai-service/         # Python AI 分析服务
├── database/           # 数据库架构和迁移文件
├── docker-compose.yml  # 本地开发环境
└── README.md
```

## 功能模块

### 三大入口
1. **管理入口** - 系统管理员使用
2. **门诊入口** - 医生和护士使用
3. **患者入口** - 患者查看报告

### 核心功能
- 📋 门诊信息管理
- 👨‍⚕️ 医生账号管理
- 👶 患者信息管理
- 📊 AI筛查分析
- 📄 智能报告生成
- 🔍 数据统计分析

### AI分析能力
- 口内照片分析
- 面相照片分析
- 头侧X光分析
- 全景X光分析
- 3D模型分析
- 综合评估报告

## 快速开始

### 环境要求
- Node.js 18+
- Python 3.9+
- PostgreSQL 14+
- Redis 6+

### 安装依赖
```bash
# 安装前端依赖
cd frontend && npm install

# 安装后端依赖
cd backend && npm install

# 安装AI服务依赖
cd ai-service && pip install -r requirements.txt
```

### 启动开发环境
```bash
# 启动数据库
docker-compose up -d postgres redis

# 启动后端服务
cd backend && npm run dev

# 启动AI服务
cd ai-service && python main.py

# 启动前端
cd frontend && npm run dev
```

## 开发路线图

- [x] 项目架构设计
- [ ] 数据库Schema设计
- [ ] 前端基础架构
- [ ] API服务搭建
- [ ] AI服务集成
- [ ] 用户认证系统
- [ ] 文件上传功能
- [ ] AI分析流程
- [ ] 报告生成系统
- [ ] 管理后台界面
- [ ] 门诊操作界面
- [ ] 患者查看界面

## 许可证

MIT License
