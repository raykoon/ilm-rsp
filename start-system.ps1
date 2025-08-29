# 儿童口腔AI筛查平台 - 系统启动脚本

Write-Host "`n🚀 ============================================" -ForegroundColor Green
Write-Host "   儿童口腔AI筛查平台 - 系统启动" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

# 检查当前目录
if (-not (Test-Path "backend-enhanced.js")) {
    Write-Host "❌ 错误: 请在项目根目录运行此脚本" -ForegroundColor Red
    Write-Host "当前目录: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

# 检查是否已有运行的服务
Write-Host "`n🔍 检查已运行的服务..." -ForegroundColor Yellow
$existingBackend = netstat -ano | Select-String ":3001.*LISTENING" -Quiet
$existingFrontend = netstat -ano | Select-String ":3000.*LISTENING" -Quiet

if ($existingBackend) {
    Write-Host "⚠️  后端服务已在运行 (端口3001)" -ForegroundColor Yellow
} else {
    Write-Host "✅ 后端端口3001可用" -ForegroundColor Green
}

if ($existingFrontend) {
    Write-Host "⚠️  前端服务已在运行 (端口3000)" -ForegroundColor Yellow
} else {
    Write-Host "✅ 前端端口3000可用" -ForegroundColor Green
}

# 如果服务已在运行，询问是否继续
if ($existingBackend -or $existingFrontend) {
    Write-Host "`n⚠️  检测到服务已在运行。" -ForegroundColor Yellow
    $continue = Read-Host "是否要重新启动? (y/N)"
    if ($continue.ToLower() -ne 'y') {
        Write-Host "取消启动。" -ForegroundColor Gray
        exit 0
    }
    
    # 停止现有服务
    Write-Host "`n🛑 停止现有Node.js服务..." -ForegroundColor Red
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep 2
}

# 启动后端服务
Write-Host "`n🔧 启动后端服务..." -ForegroundColor Blue
Write-Host "命令: node backend-enhanced.js" -ForegroundColor Gray

$backendJob = Start-Job -ScriptBlock {
    param($workingDir)
    Set-Location $workingDir
    node backend-enhanced.js
} -ArgumentList (Get-Location)

Write-Host "✅ 后端服务已启动 (Job ID: $($backendJob.Id))" -ForegroundColor Green

# 等待后端启动
Write-Host "`n⏳ 等待后端服务准备就绪..." -ForegroundColor Yellow
$backendReady = $false
$attempts = 0
$maxAttempts = 20

do {
    $attempts++
    Start-Sleep 1
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 2 -ErrorAction Stop
        $backendReady = $true
        Write-Host "✅ 后端服务就绪！" -ForegroundColor Green
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
} while (-not $backendReady -and $attempts -lt $maxAttempts)

if (-not $backendReady) {
    Write-Host "`n❌ 后端服务启动超时" -ForegroundColor Red
    Write-Host "请检查后端日志或手动启动: node backend-enhanced.js" -ForegroundColor Yellow
}

# 启动前端服务
Write-Host "`n🎨 启动前端服务..." -ForegroundColor Blue
Write-Host "命令: cd frontend && npm run dev" -ForegroundColor Gray

$frontendJob = Start-Job -ScriptBlock {
    param($workingDir)
    Set-Location "$workingDir\frontend"
    npm run dev
} -ArgumentList (Get-Location)

Write-Host "✅ 前端服务已启动 (Job ID: $($frontendJob.Id))" -ForegroundColor Green

# 等待前端启动
Write-Host "`n⏳ 等待前端服务准备就绪..." -ForegroundColor Yellow
$frontendReady = $false
$attempts = 0
$maxAttempts = 30

do {
    $attempts++
    Start-Sleep 1
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        $frontendReady = $true
        Write-Host "✅ 前端服务就绪！" -ForegroundColor Green
    } catch {
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
} while (-not $frontendReady -and $attempts -lt $maxAttempts)

if (-not $frontendReady) {
    Write-Host "`n⚠️  前端服务可能仍在启动中..." -ForegroundColor Yellow
    Write-Host "请稍后访问 http://localhost:3000 或检查启动日志" -ForegroundColor Yellow
}

# 显示最终状态
Write-Host "`n🎉 ============================================" -ForegroundColor Green
Write-Host "   系统启动完成！" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

Write-Host "`n🌐 访问地址:" -ForegroundColor Cyan
Write-Host "   前端应用: http://localhost:3000" -ForegroundColor White
Write-Host "   后端API: http://localhost:3001" -ForegroundColor White

Write-Host "`n🔑 测试账号:" -ForegroundColor Blue
Write-Host "   👑 超级管理员: super@admin.com / admin123" -ForegroundColor White
Write-Host "   👨‍⚕️ 医生: doctor@clinic.com / doctor123" -ForegroundColor White
Write-Host "   👤 患者: patient@example.com / patient123" -ForegroundColor White

Write-Host "`n💡 管理提示:" -ForegroundColor Yellow
Write-Host "   • 运行 './check-system-status.ps1' 检查系统状态" -ForegroundColor Gray
Write-Host "   • 服务在后台运行，关闭此窗口不会停止服务" -ForegroundColor Gray
Write-Host "   • 要停止服务，请使用 'taskkill /f /im node.exe'" -ForegroundColor Gray

Write-Host "`n🎊 享受使用儿童口腔AI筛查平台！" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
