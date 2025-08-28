# 前端简化启动脚本
Write-Host "🎨 启动前端服务..." -ForegroundColor Cyan

# 进入前端目录
Set-Location frontend

# 设置环境变量
$env:NODE_ENV = "development"
$env:NEXT_PUBLIC_API_URL = "http://localhost:3001"

# 检查依赖
if (!(Test-Path "node_modules")) {
    Write-Host "📦 安装前端依赖..." -ForegroundColor Yellow
    npm install
}

# 清理缓存
if (Test-Path ".next") {
    Write-Host "🗑️ 清理Next.js缓存..." -ForegroundColor Gray
    Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "🎨 启动前端开发服务器..." -ForegroundColor Green
Write-Host "📍 前端地址: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔗 后端代理: http://localhost:3000/api -> http://localhost:3001/api" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔑 测试账号:" -ForegroundColor Cyan
Write-Host "   super@admin.com / admin123" -ForegroundColor White
Write-Host "   admin@clinic.com / admin123" -ForegroundColor White
Write-Host "   doctor@clinic.com / doctor123" -ForegroundColor White
Write-Host "   patient@example.com / patient123" -ForegroundColor White
Write-Host ""

# 启动前端
npm run dev
