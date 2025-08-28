# 前端启动脚本 - 修复版
Write-Host "🎨 启动前端服务（修复版）..." -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 检查后端服务是否运行
Write-Host "🔍 检查后端服务连接..." -ForegroundColor Yellow
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ 后端服务连接正常" -ForegroundColor Green
} catch {
    Write-Host "   ❌ 后端服务未启动或不可用" -ForegroundColor Red
    Write-Host "   请先运行: .\fix-and-start-complete.ps1" -ForegroundColor Yellow
    Read-Host "   按 Enter 继续启动前端..."
}

# 进入前端目录
Set-Location frontend

# 检查并安装依赖
if (!(Test-Path "node_modules")) {
    Write-Host "📦 安装前端依赖..." -ForegroundColor Yellow
    npm install
}

# 设置环境变量
$env:NODE_ENV = "development"
$env:NEXT_PUBLIC_API_URL = "http://localhost:3001"

# 清理Next.js缓存
Write-Host "🗑️ 清理Next.js缓存..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
}

Write-Host ""
Write-Host "🎨 启动前端开发服务器..." -ForegroundColor Green
Write-Host "📍 前端地址: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔗 API代理: http://localhost:3000/api -> http://localhost:3001/api" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 可用页面:" -ForegroundColor Cyan
Write-Host "   • 首页: http://localhost:3000" -ForegroundColor White
Write-Host "   • 登录: http://localhost:3000/login" -ForegroundColor White
Write-Host "   • 管理员: http://localhost:3000/admin" -ForegroundColor White
Write-Host "   • 门诊: http://localhost:3000/clinic" -ForegroundColor White
Write-Host "   • 患者: http://localhost:3000/patient" -ForegroundColor White
Write-Host ""

Write-Host "🔑 测试账号:" -ForegroundColor Cyan
Write-Host "   超级管理员: super@admin.com / admin123" -ForegroundColor White
Write-Host "   门诊管理员: admin@clinic.com / admin123" -ForegroundColor White
Write-Host "   医生账号: doctor@clinic.com / doctor123" -ForegroundColor White
Write-Host "   患者账号: patient@example.com / patient123" -ForegroundColor White
Write-Host ""

Write-Host "🚀 正在启动前端服务器..." -ForegroundColor Green
npm run dev
