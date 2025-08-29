# 儿童口腔AI筛查平台 - 系统停止脚本

Write-Host "`n🛑 ============================================" -ForegroundColor Red
Write-Host "   儿童口腔AI筛查平台 - 系统停止" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Red

# 检查运行中的Node.js进程
Write-Host "`n🔍 检查运行中的Node.js进程..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($nodeProcesses) {
    Write-Host "发现 $($nodeProcesses.Count) 个Node.js进程:" -ForegroundColor White
    foreach ($process in $nodeProcesses) {
        Write-Host "   • PID: $($process.Id), 内存: $([math]::Round($process.WorkingSet / 1MB, 2))MB" -ForegroundColor Gray
    }
} else {
    Write-Host "✅ 没有运行中的Node.js进程" -ForegroundColor Green
    Write-Host "`n系统已经停止。" -ForegroundColor Green
    exit 0
}

# 检查端口占用
Write-Host "`n🔌 检查端口占用..." -ForegroundColor Yellow
$port3000 = netstat -ano | Select-String ":3000.*LISTENING"
$port3001 = netstat -ano | Select-String ":3001.*LISTENING"

if ($port3000) {
    Write-Host "🔴 端口3000 (前端) 正在使用" -ForegroundColor Red
} else {
    Write-Host "✅ 端口3000 (前端) 空闲" -ForegroundColor Green
}

if ($port3001) {
    Write-Host "🔴 端口3001 (后端) 正在使用" -ForegroundColor Red
} else {
    Write-Host "✅ 端口3001 (后端) 空闲" -ForegroundColor Green
}

# 询问用户确认
if ($nodeProcesses -and $nodeProcesses.Count -gt 0) {
    Write-Host "`n⚠️  即将停止所有Node.js服务。" -ForegroundColor Yellow
    Write-Host "这将关闭前端和后端服务。" -ForegroundColor Yellow
    $confirm = Read-Host "`n确认停止所有服务? (y/N)"
    
    if ($confirm.ToLower() -ne 'y') {
        Write-Host "`n❌ 取消停止操作。" -ForegroundColor Gray
        exit 0
    }
}

# 优雅停止服务
Write-Host "`n🔄 尝试优雅停止服务..." -ForegroundColor Blue

# 尝试使用SIGTERM信号
foreach ($process in $nodeProcesses) {
    try {
        Write-Host "   停止进程 PID: $($process.Id)..." -ForegroundColor Gray
        $process.CloseMainWindow()
        $process.WaitForExit(5000)  # 等待5秒
        if (-not $process.HasExited) {
            Write-Host "   进程未响应，强制结束..." -ForegroundColor Yellow
            $process.Kill()
        }
        Write-Host "   ✅ 进程 $($process.Id) 已停止" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ 无法停止进程 $($process.Id): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 等待一下，然后强制停止剩余进程
Start-Sleep 2
$remainingProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($remainingProcesses) {
    Write-Host "`n💥 强制停止剩余进程..." -ForegroundColor Red
    try {
        Stop-Process -Name "node" -Force
        Write-Host "✅ 所有Node.js进程已强制停止" -ForegroundColor Green
    } catch {
        Write-Host "❌ 强制停止失败: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "💡 您可能需要手动使用任务管理器停止进程" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n✅ 所有Node.js进程已成功停止" -ForegroundColor Green
}

# 再次检查端口状态
Write-Host "`n🔍 验证端口释放..." -ForegroundColor Yellow
Start-Sleep 1

$port3000After = netstat -ano | Select-String ":3000.*LISTENING"
$port3001After = netstat -ano | Select-String ":3001.*LISTENING"

if (-not $port3000After -and -not $port3001After) {
    Write-Host "✅ 所有端口已释放" -ForegroundColor Green
} else {
    Write-Host "⚠️  部分端口可能仍在占用:" -ForegroundColor Yellow
    if ($port3000After) {
        Write-Host "   • 端口3000仍在使用" -ForegroundColor Red
    }
    if ($port3001After) {
        Write-Host "   • 端口3001仍在使用" -ForegroundColor Red
    }
}

# 清理临时文件 (可选)
Write-Host "`n🧹 清理临时文件..." -ForegroundColor Cyan
$tempFiles = @(
    "frontend\.next\cache",
    "frontend\node_modules\.cache"
)

foreach ($tempPath in $tempFiles) {
    if (Test-Path $tempPath) {
        try {
            Remove-Item $tempPath -Recurse -Force -ErrorAction Stop
            Write-Host "   ✅ 已清理: $tempPath" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  无法清理: $tempPath" -ForegroundColor Yellow
        }
    }
}

# 显示最终状态
Write-Host "`n✅ ============================================" -ForegroundColor Green
Write-Host "   系统停止完成！" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green

Write-Host "`n📊 最终状态:" -ForegroundColor Cyan
$finalNodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($finalNodeProcesses) {
    Write-Host "   ⚠️  仍有 $($finalNodeProcesses.Count) 个Node.js进程运行" -ForegroundColor Yellow
    Write-Host "   💡 这些可能是其他应用的Node.js进程" -ForegroundColor Gray
} else {
    Write-Host "   ✅ 所有Node.js进程已停止" -ForegroundColor Green
}

Write-Host "`n💡 重新启动提示:" -ForegroundColor Blue
Write-Host "   • 运行 './start-system.ps1' 重新启动系统" -ForegroundColor White
Write-Host "   • 运行 './check-system-status.ps1' 检查系统状态" -ForegroundColor White

Write-Host "`n🎯 系统已安全停止！" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
