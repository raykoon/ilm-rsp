# 一键启动开发环境脚本
Write-Host "🚀 启动儿童口腔筛查平台开发环境" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# 1. 启动基础服务 (数据库、Redis、MinIO)
Write-Host "📦 启动基础服务 (PostgreSQL + Redis + MinIO)..." -ForegroundColor Yellow
docker-compose -f docker-compose.services.yml up -d

# 等待服务启动
Write-Host "⏳ 等待基础服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 检查服务状态
Write-Host "🔍 检查基础服务状态..." -ForegroundColor Yellow
docker-compose -f docker-compose.services.yml ps

Write-Host ""
Write-Host "✅ 基础服务启动完成!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 接下来请手动启动应用服务:" -ForegroundColor Cyan
Write-Host "   1. 简化版后端: .\start-backend.ps1" -ForegroundColor White
Write-Host "   2. 🌟 完整版后端: .\start-backend-full.ps1" -ForegroundColor Green
Write-Host "   3. 🤖 AI报告解读服务: .\start-ai-service.ps1" -ForegroundColor Magenta
Write-Host "   4. 前端服务: .\start-frontend.ps1" -ForegroundColor White
Write-Host ""
Write-Host "📋 服务地址:" -ForegroundColor Cyan
Write-Host "   • 前端: http://localhost:3000" -ForegroundColor White
Write-Host "   • 后端: http://localhost:3001" -ForegroundColor White
Write-Host "   • AI服务: http://localhost:8000" -ForegroundColor White
Write-Host "   • MinIO: http://localhost:9001" -ForegroundColor White
Write-Host "   • 数据库: localhost:5432" -ForegroundColor White
Write-Host "   • Redis: localhost:6379" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  注意: 如果需要AI服务，请单独启动 Docker 中的 AI 服务:" -ForegroundColor Yellow
Write-Host "   docker-compose up -d ai-service" -ForegroundColor Gray
Write-Host ""
