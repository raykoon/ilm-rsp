# 完整版后端启动脚本
Write-Host "🚀 启动完整版后端服务..." -ForegroundColor Green

# 设置环境变量
$env:NODE_ENV = "development"
$env:PORT = "3001"
$env:DATABASE_URL = "postgresql://postgres:postgres123@localhost:5432/ilm_rsp"
$env:REDIS_URL = "redis://:redis123@localhost:6379"
$env:JWT_SECRET = "your-super-secret-jwt-key-at-least-32-characters-long"
$env:JWT_EXPIRES_IN = "7d"
$env:JWT_REFRESH_EXPIRES_IN = "30d"
$env:MINIO_ENDPOINT = "localhost"
$env:MINIO_PORT = "9000"
$env:MINIO_ACCESS_KEY = "admin"
$env:MINIO_SECRET_KEY = "admin123"
$env:MINIO_BUCKET = "ilm-rsp-files"
$env:AI_SERVICE_URL = "http://localhost:8000"
$env:UPLOAD_PATH = "./uploads"
$env:MAX_FILE_SIZE = "52428800"
$env:LOG_LEVEL = "debug"
$env:LOG_FILE = "./logs/app.log"
$env:CORS_ORIGINS = "http://localhost:3000,http://localhost:3001"

# 进入后端目录
Set-Location backend

# 检查依赖
if (!(Test-Path "node_modules")) {
    Write-Host "📦 安装依赖..." -ForegroundColor Yellow
    npm install
}

# 生成Prisma客户端
Write-Host "🗄️  生成Prisma客户端..." -ForegroundColor Yellow
npx prisma generate

# 运行数据库迁移
Write-Host "📊 运行数据库迁移..." -ForegroundColor Yellow
npx prisma db push

# 创建种子数据
Write-Host "🌱 创建种子数据..." -ForegroundColor Yellow
npx ts-node prisma/seed.ts

# 启动完整版开发服务器
Write-Host "✅ 启动完整版后端服务器 - http://localhost:3001" -ForegroundColor Green
Write-Host ""
Write-Host "📋 可用的API端点:" -ForegroundColor Cyan
Write-Host "   🔐 登录: POST /api/auth/login" -ForegroundColor White
Write-Host "   📝 注册: POST /api/auth/register" -ForegroundColor White
Write-Host "   👤 用户信息: GET /api/users/profile" -ForegroundColor White
Write-Host "   🏥 门诊列表: GET /api/clinics" -ForegroundColor White
Write-Host "   📋 检查记录: GET /api/examinations" -ForegroundColor White
Write-Host "   📊 统计信息: GET /api/stats/overview" -ForegroundColor White
Write-Host "   ❤️  健康检查: GET /health" -ForegroundColor White
Write-Host ""
Write-Host "🧪 测试账号:" -ForegroundColor Cyan
Write-Host "   超级管理员: super@admin.com / admin123" -ForegroundColor White
Write-Host "   门诊管理员: admin@clinic.com / admin123" -ForegroundColor White
Write-Host "   医生账号: doctor@clinic.com / doctor123" -ForegroundColor White
Write-Host "   患者账号: patient@example.com / patient123" -ForegroundColor White
Write-Host ""

npx ts-node src/server-full.ts
