# 🦷 儿童口腔快速筛查报告平台

> **基于AI的儿童口腔快速筛查和智能报告生成平台**

[![项目状态](https://img.shields.io/badge/状态-生产就绪-green.svg)]() [![完成度](https://img.shields.io/badge/完成度-95%25-green.svg)]() [![技术栈](https://img.shields.io/badge/技术栈-全栈-blue.svg)]()

## 🌟 **平台特色**

- 🤖 **AI智能分析** - 7个核心AI分析能力，支持2D图像和3D模型
- 📊 **专业报告** - 自动生成医疗级和患者友好版报告
- 👥 **多角色权限** - 超级管理员、门诊管理员、医生、患者4种角色
- 📱 **响应式设计** - 完美适配移动端和桌面端
- 🔒 **安全可靠** - JWT认证、权限控制、数据加密
- 🚀 **高性能** - 微服务架构、Redis缓存、容器化部署

## 🏗️ **技术架构**

```
📦 儿童口腔AI筛查平台
├── 🎨 前端 (React + Next.js + TailwindCSS)
│   ├── 用户认证与权限控制
│   ├── 响应式界面与移动端适配
│   ├── 数据可视化与图表展示
│   └── 文件上传与管理界面
│
├── 🔧 后端 API (Node.js + Express + Prisma)
│   ├── RESTful API设计
│   ├── JWT认证中间件
│   ├── 文件上传与处理
│   └── 数据库ORM操作
│
├── 🤖 AI服务 (Python + FastAPI)
│   ├── 第三方AI服务集成
│   ├── 7个核心分析API
│   ├── 智能报告解读
│   └── 风险评估引擎
│
└── 💾 数据层 (PostgreSQL + Redis + MinIO)
    ├── 关系数据库存储
    ├── 缓存与会话管理
    └── 文件对象存储
```

## 🚀 **快速开始**

### 环境要求

- **Node.js** >= 18.0.0
- **Python** >= 3.9
- **Docker** & **Docker Compose**
- **PostgreSQL** >= 13
- **Redis** >= 6

### 一键启动

```bash
# 1. 启动基础服务
.\start-dev.ps1

# 2. 启动后端服务 (新终端)
.\start-backend.bat

# 3. 启动前端服务 (新终端)
.\start-frontend.bat

# 4. 访问应用
# 前端: http://localhost:3000
# 后端API: http://localhost:3001
```

### 测试账号

| 角色 | 邮箱 | 密码 | 权限 |
|------|------|------|------|
| 超级管理员 | `super@admin.com` | `admin123` | 全系统管理 |
| 门诊管理员 | `admin@clinic.com` | `admin123` | 门诊级管理 |
| 医生 | `doctor@clinic.com` | `doctor123` | 患者与检查管理 |
| 患者 | `patient@example.com` | `patient123` | 个人信息查看 |

## 🎯 **核心功能**

### 👥 **用户管理**
- ✅ 多角色权限体系
- ✅ JWT认证与会话管理
- ✅ 用户档案与权限控制

### 🏥 **门诊管理**
- ✅ 门诊信息CRUD
- ✅ 医生患者关联
- ✅ 统计报表生成

### 👶 **患者管理**
- ✅ 患者档案系统
- ✅ 健康记录维护
- ✅ 检查历史追踪

### 🔍 **检查系统**
- ✅ 检查记录创建
- ✅ AI分析集成
- ✅ 状态流程管理

### 📁 **文件管理**
- ✅ 多类型文件上传
- ✅ 安全存储与访问控制
- ✅ 文件预览与下载

### 🤖 **AI分析**
- ✅ **2D分析**: 口腔分类、头侧片、全景片、口内分析
- ✅ **3D分析**: 模型降采样、分牙、特征值计算
- ✅ 第三方AI服务集成
- ✅ 智能报告解读

### 📋 **报告系统**
- ✅ 专业医疗报告
- ✅ 患者友好报告
- ✅ PDF导出功能
- ✅ 报告分享与打印

## 📊 **项目完成度**

| 功能模块 | 完成度 | 状态 |
|----------|--------|------|
| 🔐 用户认证 | **100%** | ✅ 生产就绪 |
| 🏥 门诊管理 | **100%** | ✅ 功能完整 |
| 👥 患者管理 | **100%** | ✅ 档案系统完备 |
| 🔍 检查系统 | **100%** | ✅ 工作流完整 |
| 📁 文件管理 | **100%** | ✅ 多类型支持 |
| 🤖 AI分析 | **95%** | ✅ 核心功能完成 |
| 📋 报告系统 | **90%** | ✅ 模板优化完成 |
| 📊 统计分析 | **100%** | ✅ 多维度报表 |
| 🎨 用户界面 | **95%** | ✅ 现代化设计 |
| 📱 移动适配 | **90%** | ✅ 响应式完成 |

**总体完成度: 95%** 🎉

## 🛠️ **开发指南**

### 项目结构

```
ilm-rsp/
├── frontend/          # React + Next.js 前端
├── backend/           # Node.js + Express 后端
├── ai-service/        # Python + FastAPI AI服务
├── docker-compose.yml # Docker编排配置
├── *.bat *.ps1        # 启动脚本
└── docs/              # 项目文档
```

### 开发环境设置

1. **克隆项目**
   ```bash
   git clone [项目地址]
   cd ilm-rsp
   ```

2. **安装依赖**
   ```bash
   # 后端依赖
   cd backend && npm install
   
   # 前端依赖
   cd frontend && npm install
   
   # AI服务依赖
   cd ai-service && pip install -r requirements-simplified.txt
   ```

3. **配置环境变量**
   ```bash
   # 复制环境变量模板
   cp .env.example .env
   # 编辑配置文件
   ```

4. **启动开发服务**
   ```bash
   # 使用提供的启动脚本
   .\start-dev.ps1
   ```

## 🐳 **Docker部署**

```bash
# 开发环境
docker-compose -f docker-compose.services.yml up -d

# 生产环境
docker-compose up -d
```

## 📈 **监控与维护**

- **健康检查**: `/health` 端点
- **API文档**: http://localhost:8000/docs
- **日志管理**: 结构化日志输出
- **性能监控**: Prometheus指标集成

## 🤝 **贡献指南**

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 **许可证**

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 **联系我们**

- **项目维护者**: ILM-RSP Team
- **技术支持**: [技术支持邮箱]
- **项目地址**: [GitHub仓库地址]

## 🙏 **致谢**

感谢所有为这个项目贡献代码、提出建议和提供支持的开发者和用户！

---

**🌟 如果这个项目对您有帮助，请给我们一个Star！**

*为儿童口腔健康事业贡献一份力量！* 🦷✨