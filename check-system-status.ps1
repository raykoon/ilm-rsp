# 儿童口腔AI筛查平台 - 系统状态检查脚本

Write-Host "`n🔍 ============================================" -ForegroundColor Cyan
Write-Host "   儿童口腔AI筛查平台 - 系统状态检查" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# 检查Node.js进程
Write-Host "`n📊 检查Node.js进程..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "✅ 发现 $($nodeProcesses.Count) 个Node.js进程:" -ForegroundColor Green
    foreach ($process in $nodeProcesses) {
        Write-Host "   • PID: $($process.Id), 内存: $([math]::Round($process.WorkingSet / 1MB, 2))MB" -ForegroundColor White
    }
} else {
    Write-Host "❌ 未发现Node.js进程" -ForegroundColor Red
}

# 检查端口占用
Write-Host "`n🔌 检查端口占用..." -ForegroundColor Yellow
$port3000 = netstat -ano | Select-String ":3000.*LISTENING"
$port3001 = netstat -ano | Select-String ":3001.*LISTENING"

if ($port3000) {
    Write-Host "✅ 端口3000 (前端): 正在监听" -ForegroundColor Green
} else {
    Write-Host "❌ 端口3000 (前端): 未监听" -ForegroundColor Red
}

if ($port3001) {
    Write-Host "✅ 端口3001 (后端): 正在监听" -ForegroundColor Green
} else {
    Write-Host "❌ 端口3001 (后端): 未监听" -ForegroundColor Red
}

# 检查后端健康状态
Write-Host "`n🏥 检查后端服务健康状态..." -ForegroundColor Yellow
try {
    $backendHealth = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 5
    Write-Host "✅ 后端服务健康检查通过" -ForegroundColor Green
} catch {
    Write-Host "❌ 后端服务健康检查失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 检查前端服务
Write-Host "`n🎨 检查前端服务..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 8 -ErrorAction Stop
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ 前端服务响应正常 (状态码: $($frontendResponse.StatusCode))" -ForegroundColor Green
    } else {
        Write-Host "⚠️  前端服务响应异常 (状态码: $($frontendResponse.StatusCode))" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ 前端服务无法访问: $($_.Exception.Message)" -ForegroundColor Red
}

# 显示访问链接和测试账号
Write-Host "`n🔗 ============================================" -ForegroundColor Cyan
Write-Host "   系统访问信息" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

Write-Host "`n🌐 访问地址:" -ForegroundColor Green
Write-Host "   前端应用: http://localhost:3000" -ForegroundColor White
Write-Host "   后端API: http://localhost:3001" -ForegroundColor White
Write-Host "   健康检查: http://localhost:3001/health" -ForegroundColor White

Write-Host "`n🔑 测试账号:" -ForegroundColor Blue
Write-Host "   👑 超级管理员: super@admin.com / admin123" -ForegroundColor White
Write-Host "   🏥 门诊管理员: admin@clinic.com / admin123" -ForegroundColor White
Write-Host "   👨‍⚕️ 医生: doctor@clinic.com / doctor123" -ForegroundColor White
Write-Host "   👤 患者: patient@example.com / patient123" -ForegroundColor White

# 系统总结
Write-Host "`n📋 ============================================" -ForegroundColor Cyan
Write-Host "   系统状态总结" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

$backendRunning = $port3001 -ne $null
$frontendRunning = $port3000 -ne $null

if ($backendRunning -and $frontendRunning) {
    Write-Host "`n🎉 系统运行状态: 完全正常" -ForegroundColor Green
    Write-Host "✅ 前端和后端服务都在正常运行" -ForegroundColor Green
    Write-Host "🚀 您可以开始使用系统了！" -ForegroundColor Green
} elseif ($backendRunning -or $frontendRunning) {
    Write-Host "`n⚠️  系统运行状态: 部分运行" -ForegroundColor Yellow
    if (-not $backendRunning) {
        Write-Host "❌ 后端服务未运行，请执行: node backend-enhanced.js" -ForegroundColor Red
    }
    if (-not $frontendRunning) {
        Write-Host "❌ 前端服务未运行，请执行: cd frontend; npm run dev" -ForegroundColor Red
    }
} else {
    Write-Host "`n❌ 系统运行状态: 未运行" -ForegroundColor Red
    Write-Host "请按以下步骤启动系统:" -ForegroundColor Yellow
    Write-Host "1. 启动后端: node backend-enhanced.js" -ForegroundColor White
    Write-Host "2. 启动前端: cd frontend; npm run dev" -ForegroundColor White
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "检查完成！$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host "============================================`n" -ForegroundColor Cyan
