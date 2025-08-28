# 完整系统测试脚本
Write-Host "🧪 开始测试完整系统..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. 测试基础服务
Write-Host "📦 1. 测试基础服务..." -ForegroundColor Yellow

# 测试PostgreSQL
try {
    $pg = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
    if ($pg.TcpTestSucceeded) {
        Write-Host "   ✅ PostgreSQL: 连接正常 (端口 5432)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ PostgreSQL: 连接失败" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ PostgreSQL: 测试失败" -ForegroundColor Red
}

# 测试Redis
try {
    $redis = Test-NetConnection -ComputerName localhost -Port 6379 -WarningAction SilentlyContinue
    if ($redis.TcpTestSucceeded) {
        Write-Host "   ✅ Redis: 连接正常 (端口 6379)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Redis: 连接失败" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ Redis: 测试失败" -ForegroundColor Red
}

# 测试MinIO
try {
    $minio = Test-NetConnection -ComputerName localhost -Port 9000 -WarningAction SilentlyContinue
    if ($minio.TcpTestSucceeded) {
        Write-Host "   ✅ MinIO: 连接正常 (端口 9000)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ MinIO: 连接失败" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ MinIO: 测试失败" -ForegroundColor Red
}

Write-Host ""

# 2. 测试后端API
Write-Host "🔧 2. 测试后端API..." -ForegroundColor Yellow

# 测试健康检查
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 5
    if ($healthResponse.StatusCode -eq 200) {
        $healthData = $healthResponse.Content | ConvertFrom-Json
        Write-Host "   ✅ 健康检查: 正常 - 状态: $($healthData.status)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ 健康检查: 失败 - 后端服务可能未启动" -ForegroundColor Red
}

# 测试登录API
try {
    $loginBody = @{
        email = "admin@ilm-rsp.com"
        password = "admin123"
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing -TimeoutSec 5
    
    if ($loginResponse.StatusCode -eq 200) {
        $loginData = $loginResponse.Content | ConvertFrom-Json
        Write-Host "   ✅ 登录API: 正常 - 获得令牌" -ForegroundColor Green
        $token = $loginData.data.token
        
        # 测试受保护的API
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        
        try {
            $statsResponse = Invoke-WebRequest -Uri "http://localhost:3001/api/stats/overview" -Headers $headers -UseBasicParsing -TimeoutSec 5
            if ($statsResponse.StatusCode -eq 200) {
                $statsData = $statsResponse.Content | ConvertFrom-Json
                Write-Host "   ✅ 统计API: 正常 - 获得数据" -ForegroundColor Green
                Write-Host "      • 总检查数: $($statsData.data.totalExaminations)" -ForegroundColor Gray
                Write-Host "      • 总患者数: $($statsData.data.totalPatients)" -ForegroundColor Gray
            }
        } catch {
            Write-Host "   ❌ 统计API: 失败" -ForegroundColor Red
        }
        
    }
} catch {
    Write-Host "   ❌ 登录API: 失败" -ForegroundColor Red
}

Write-Host ""

# 3. 测试前端服务
Write-Host "🎨 3. 测试前端服务..." -ForegroundColor Yellow

try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "   ✅ 前端服务: 正常运行 (端口 3000)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ 前端服务: 失败 - 前端可能未启动" -ForegroundColor Red
}

Write-Host ""

# 4. 测试AI服务
Write-Host "🤖 4. 测试AI服务..." -ForegroundColor Yellow

try {
    $aiResponse = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
    if ($aiResponse.StatusCode -eq 200) {
        Write-Host "   ✅ AI服务: 正常运行 (端口 8000)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ AI服务: 失败 - AI服务可能未启动" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎉 系统测试完成!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 如果所有服务都正常，您可以:" -ForegroundColor Cyan
Write-Host "   1. 访问前端: http://localhost:3000" -ForegroundColor White
Write-Host "   2. 使用测试账号登录:" -ForegroundColor White
Write-Host "      • 超级管理员: admin@ilm-rsp.com / admin123" -ForegroundColor Gray
Write-Host "      • 门诊管理员: admin1@clinic.com / admin123" -ForegroundColor Gray
Write-Host "      • 医生账号: doctor1@clinic.com / doctor123" -ForegroundColor Gray
Write-Host "      • 患者账号: patient1@example.com / patient123" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 如果有服务失败，请检查:" -ForegroundColor Yellow
Write-Host "   • 基础服务是否启动: .\start-dev.ps1" -ForegroundColor Gray
Write-Host "   • 后端服务是否启动: .\start-backend-full.ps1" -ForegroundColor Gray
Write-Host "   • 前端服务是否启动: .\start-frontend.ps1" -ForegroundColor Gray
Write-Host ""
