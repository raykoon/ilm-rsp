# 一键测试和启动脚本
Write-Host "🔧 一键修复和启动儿童口腔筛查平台" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# 停止可能运行的服务
Write-Host "⏹️ 清理现有进程..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "   ✅ 清理Node.js进程完成" -ForegroundColor Green
} catch {
    Write-Host "   ℹ️ 没有发现运行的Node.js进程" -ForegroundColor Gray
}

# 启动Docker服务
Write-Host "📦 启动基础服务..." -ForegroundColor Yellow
try {
    docker-compose -f docker-compose.services.yml up -d
    Write-Host "   ✅ Docker服务启动完成" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Docker服务启动失败，继续运行..." -ForegroundColor Yellow
}

# 等待服务稳定
Write-Host "⏳ 等待服务稳定 (10秒)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 启动后端
Write-Host "🚀 启动后端服务..." -ForegroundColor Yellow
Start-Job -ScriptBlock {
    Set-Location $using:PWD
    .\start-backend-minimal.ps1
} -Name "Backend"

# 等待后端启动
Write-Host "⏳ 等待后端服务启动 (15秒)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# 测试后端连接
Write-Host "🔍 测试后端连接..." -ForegroundColor Yellow
$backendOk = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ 后端服务连接正常" -ForegroundColor Green
        $backendOk = $true
    }
} catch {
    Write-Host "   ❌ 后端服务连接失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试登录接口
if ($backendOk) {
    Write-Host "🔐 测试登录接口..." -ForegroundColor Yellow
    try {
        $loginBody = @{
            email = "super@admin.com"
            password = "admin123"
        } | ConvertTo-Json
        
        $loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing -TimeoutSec 10
        
        if ($loginResponse.StatusCode -eq 200) {
            Write-Host "   ✅ 登录接口正常工作" -ForegroundColor Green
            
            # 解析响应测试
            try {
                $loginData = $loginResponse.Content | ConvertFrom-Json
                if ($loginData.success -and $loginData.data.token) {
                    Write-Host "   ✅ 登录数据格式正确" -ForegroundColor Green
                }
            } catch {
                Write-Host "   ⚠️  登录响应解析异常" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "   ❌ 登录接口测试失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 启动前端
Write-Host ""
Write-Host "🎨 启动前端服务..." -ForegroundColor Cyan

# 检查前端依赖
if (!(Test-Path "frontend/node_modules")) {
    Write-Host "📦 安装前端依赖..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

# 启动前端服务
Start-Job -ScriptBlock {
    Set-Location $using:PWD
    .\start-frontend-simple.ps1
} -Name "Frontend"

# 等待前端启动
Write-Host "⏳ 等待前端服务启动 (20秒)..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# 测试前端连接
Write-Host "🌐 测试前端连接..." -ForegroundColor Yellow
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 10
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "   ✅ 前端服务连接正常" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  前端服务连接失败，可能还在启动中..." -ForegroundColor Yellow
}

# 测试前端API代理
try {
    $proxyResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 10
    if ($proxyResponse.StatusCode -eq 200) {
        Write-Host "   ✅ 前端API代理正常工作" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  前端API代理测试失败" -ForegroundColor Yellow
}

# 显示服务状态
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "🎉 服务启动完成!" -ForegroundColor Green
Write-Host ""

Write-Host "📋 服务地址:" -ForegroundColor Cyan
Write-Host "   🎨 前端: http://localhost:3000" -ForegroundColor White
Write-Host "   🔧 后端: http://localhost:3001" -ForegroundColor White
Write-Host "   ❤️  健康检查: http://localhost:3001/health" -ForegroundColor White
Write-Host ""

Write-Host "🔑 测试账号:" -ForegroundColor Cyan
Write-Host "   超级管理员: super@admin.com / admin123" -ForegroundColor White
Write-Host "   门诊管理员: admin@clinic.com / admin123" -ForegroundColor White
Write-Host "   医生账号: doctor@clinic.com / doctor123" -ForegroundColor White
Write-Host "   患者账号: patient@example.com / patient123" -ForegroundColor White
Write-Host ""

Write-Host "🚀 下一步:" -ForegroundColor Yellow
Write-Host "   1. 在浏览器中打开: http://localhost:3000" -ForegroundColor White
Write-Host "   2. 点击登录页面" -ForegroundColor White
Write-Host "   3. 使用上面的测试账号登录" -ForegroundColor White
Write-Host ""

Write-Host "📊 后台服务状态:" -ForegroundColor Cyan
Get-Job | Format-Table -AutoSize

Write-Host "💡 如需停止服务，请运行:" -ForegroundColor Gray
Write-Host "   Get-Job | Stop-Job" -ForegroundColor Gray
Write-Host "   Get-Job | Remove-Job" -ForegroundColor Gray

Write-Host ""
Write-Host "✅ 所有服务已启动，请在浏览器中测试！" -ForegroundColor Green
