# 前端本地开发启动脚本
Write-Host "🎨 启动前端开发服务..." -ForegroundColor Green

# 进入前端目录
Set-Location frontend

# 检查依赖
if (!(Test-Path "node_modules")) {
    Write-Host "📦 安装依赖..." -ForegroundColor Yellow
    npm install
}

# 启动开发服务器
Write-Host "✅ 启动前端服务器 - http://localhost:3000" -ForegroundColor Green
npm run dev
