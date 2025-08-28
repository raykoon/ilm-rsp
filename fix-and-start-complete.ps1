# 强制修复并启动完整系统脚本
Write-Host "🔧 强制修复并启动儿童口腔筛查平台..." -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# 停止可能存在的服务
Write-Host "⏹️ 停止可能存在的服务..." -ForegroundColor Yellow
try {
    docker-compose -f docker-compose.services.yml down
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "python" -ErrorAction SilentlyContinue | Stop-Process -Force
} catch {
    Write-Host "   (清理现有服务)" -ForegroundColor Gray
}

# 启动基础服务
Write-Host "📦 启动基础服务..." -ForegroundColor Yellow
docker-compose -f docker-compose.services.yml up -d

Write-Host "⏳ 等待基础服务启动 (15秒)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# 检查基础服务
Write-Host "🔍 检查基础服务状态..." -ForegroundColor Yellow
docker-compose -f docker-compose.services.yml ps

# 进入后端目录并强制重新安装依赖
Write-Host "🛠️  修复后端依赖..." -ForegroundColor Yellow
Set-Location backend

# 清理并重新安装依赖
if (Test-Path "node_modules") {
    Write-Host "   🗑️ 清理现有依赖..." -ForegroundColor Gray
    Remove-Item -Recurse -Force node_modules
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
}

Write-Host "   📦 重新安装依赖..." -ForegroundColor Gray
npm cache clean --force
npm install

# 设置环境变量
Write-Host "🔧 设置环境变量..." -ForegroundColor Yellow
$env:NODE_ENV = "development"
$env:PORT = "3001"
$env:DATABASE_URL = "postgresql://postgres:postgres123@localhost:5432/ilm_rsp"
$env:REDIS_URL = "redis://:redis123@localhost:6379"
$env:JWT_SECRET = "your-super-secret-jwt-key-at-least-32-characters-long-for-production-use"
$env:JWT_EXPIRES_IN = "7d"
$env:CORS_ORIGINS = "http://localhost:3000,http://localhost:3001"

# 强制重新生成Prisma
Write-Host "🗄️  重新生成Prisma客户端..." -ForegroundColor Yellow
npx prisma generate --force

# 推送数据库结构
Write-Host "📊 推送数据库结构..." -ForegroundColor Yellow
npx prisma db push --force-reset --accept-data-loss

# 等待数据库稳定
Write-Host "⏳ 等待数据库稳定..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 创建种子数据
Write-Host "🌱 创建种子数据..." -ForegroundColor Yellow
try {
    npx ts-node prisma/seed.ts
    Write-Host "   ✅ 种子数据创建成功" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  种子数据创建失败，但继续启动" -ForegroundColor Yellow
}

# 测试数据库连接
Write-Host "🔍 测试数据库连接..." -ForegroundColor Yellow
try {
    $testScript = @'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testConnection() {
  try {
    await prisma.$connect();
    const userCount = await prisma.user.count();
    console.log('✅ 数据库连接成功，用户数量:', userCount);
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ 数据库连接失败:', error);
    process.exit(1);
  }
}

testConnection();
'@
    
    $testScript | Out-File -FilePath "test-db.js" -Encoding UTF8
    node test-db.js
    Remove-Item -Force test-db.js
} catch {
    Write-Host "   ❌ 数据库连接测试失败" -ForegroundColor Red
}

Write-Host ""
Write-Host "🚀 启动后端服务..." -ForegroundColor Green
Write-Host "📍 服务地址: http://localhost:3001" -ForegroundColor Cyan
Write-Host "📋 主要端点:" -ForegroundColor Cyan
Write-Host "   • 健康检查: GET http://localhost:3001/health" -ForegroundColor White
Write-Host "   • 用户登录: POST http://localhost:3001/api/auth/login" -ForegroundColor White
Write-Host "   • 用户信息: GET http://localhost:3001/api/auth/me" -ForegroundColor White
Write-Host ""

Write-Host "🔑 测试账号:" -ForegroundColor Cyan
Write-Host "   超级管理员: super@admin.com / admin123" -ForegroundColor White
Write-Host "   门诊管理员: admin@clinic.com / admin123" -ForegroundColor White
Write-Host "   医生账号: doctor@clinic.com / doctor123" -ForegroundColor White
Write-Host "   患者账号: patient@example.com / patient123" -ForegroundColor White
Write-Host ""

Write-Host "⚡ 正在启动服务器，请在新终端窗口运行前端..." -ForegroundColor Yellow
Write-Host "   前端启动命令: .\start-frontend.ps1" -ForegroundColor Gray
Write-Host ""

# 启动服务器
npx ts-node src/server-full.ts
