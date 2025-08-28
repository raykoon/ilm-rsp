# 测试后端服务脚本
Write-Host "🧪 测试后端服务..." -ForegroundColor Cyan

# 检查端口3001是否被占用
$port3001 = netstat -an | findstr ":3001"
if ($port3001) {
    Write-Host "✅ 端口3001正在使用中:" -ForegroundColor Green
    Write-Host $port3001 -ForegroundColor Gray
} else {
    Write-Host "❌ 端口3001没有被占用，后端服务可能没有启动" -ForegroundColor Red
    Write-Host "请先运行: .\start-backend.ps1" -ForegroundColor Yellow
    exit
}

# 测试健康检查接口
Write-Host "🔍 测试健康检查接口..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✅ 健康检查成功:" -ForegroundColor Green
    Write-Host "   状态: $($data.status)" -ForegroundColor White
    Write-Host "   环境: $($data.environment)" -ForegroundColor White
    Write-Host "   运行时间: $([math]::Round($data.uptime, 2))秒" -ForegroundColor White
} catch {
    Write-Host "❌ 健康检查失败: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 测试登录接口
Write-Host "🔐 测试登录接口..." -ForegroundColor Yellow
try {
    $loginData = @{
        email = "admin@test.com"
        password = "123456"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing
    $data = $response.Content | ConvertFrom-Json
    Write-Host "✅ 登录接口测试成功:" -ForegroundColor Green
    Write-Host "   Token: $($data.data.token.Substring(0, 20))..." -ForegroundColor White
    Write-Host "   用户: $($data.data.user.name)" -ForegroundColor White
} catch {
    Write-Host "❌ 登录接口测试失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 后端服务测试完成!" -ForegroundColor Cyan
