# 简单的系统状态检查

Write-Host "`n🔍 系统状态检查" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan

# 检查后端 (3001端口)
Write-Host "`n📊 检查后端服务..." -ForegroundColor Yellow
try {
    $backend = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5
    Write-Host "✅ 后端服务 (3001): 正常运行" -ForegroundColor Green
}
catch {
    Write-Host "❌ 后端服务 (3001): 异常" -ForegroundColor Red
}

# 检查前端 (3000端口)  
Write-Host "`n🎨 检查前端服务..." -ForegroundColor Yellow
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 8
    Write-Host "✅ 前端服务 (3000): 正常运行" -ForegroundColor Green
}
catch {
    Write-Host "❌ 前端服务 (3000): 异常" -ForegroundColor Red
}

# 检查Node.js进程
Write-Host "`n🔧 检查Node.js进程..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "✅ 发现 $($nodeProcesses.Count) 个Node.js进程" -ForegroundColor Green
} else {
    Write-Host "❌ 未发现Node.js进程" -ForegroundColor Red
}

# 显示访问地址
Write-Host "`n🌐 访问地址:" -ForegroundColor Cyan
Write-Host "   前端: http://localhost:3000" -ForegroundColor White
Write-Host "   后端: http://localhost:3001" -ForegroundColor White

Write-Host "`n🔑 测试账号:" -ForegroundColor Blue
Write-Host "   管理员: super@admin.com / admin123" -ForegroundColor White
Write-Host "   医生: doctor@clinic.com / doctor123" -ForegroundColor White

Write-Host "`n===================" -ForegroundColor Cyan
Write-Host "检查完成! $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Gray
