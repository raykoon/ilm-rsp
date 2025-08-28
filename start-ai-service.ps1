# AI报告解读服务启动脚本
Write-Host "🤖 启动AI报告解读服务..." -ForegroundColor Green

# 设置环境变量
$env:ENVIRONMENT = "development"
$env:SERVER_HOST = "0.0.0.0"
$env:SERVER_PORT = "8000"
$env:DATABASE_URL = "postgresql://postgres:postgres123@localhost:5432/ilm_rsp"
$env:REDIS_URL = "redis://:redis123@localhost:6379"
$env:SECRET_KEY = "your-super-secret-key-for-ai-service"
$env:CORS_ORIGINS = "http://localhost:3000,http://localhost:3001"

# 第三方AI服务配置
$env:THIRD_PARTY_AI_BASE_URL = "https://openapi-lab.ilmsmile.com.cn/api/v1"
$env:THIRD_PARTY_AI_KEY = ""  # 需要配置实际的API Key
$env:THIRD_PARTY_AI_SECRET = ""  # 需要配置实际的API Secret

# 开发环境使用模拟API
$env:MOCK_THIRD_PARTY_API = "true"
$env:MOCK_AI_RESULTS = "true"

$env:LOG_LEVEL = "INFO"

# 进入AI服务目录
Set-Location ai-service

# 检查Python环境
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 未找到Python环境，请先安装Python 3.11+" -ForegroundColor Red
    exit 1
}

# 检查依赖
if (!(Test-Path "requirements-simplified.txt")) {
    Write-Host "❌ 未找到依赖文件 requirements-simplified.txt" -ForegroundColor Red
    exit 1
}

# 创建虚拟环境（如果不存在）
if (!(Test-Path ".venv")) {
    Write-Host "📦 创建Python虚拟环境..." -ForegroundColor Yellow
    python -m venv .venv
}

# 激活虚拟环境
Write-Host "🔧 激活虚拟环境..." -ForegroundColor Yellow
if ($IsWindows -or $env:OS -eq "Windows_NT") {
    .\.venv\Scripts\Activate.ps1
} else {
    . .venv/bin/activate
}

# 安装依赖
Write-Host "📦 安装依赖包..." -ForegroundColor Yellow
python -m pip install --upgrade pip
pip install -r requirements-simplified.txt

# 创建必要目录
Write-Host "📁 创建必要目录..." -ForegroundColor Yellow
if (!(Test-Path "uploads")) { mkdir uploads }
if (!(Test-Path "reports")) { mkdir reports }
if (!(Test-Path "templates")) { mkdir templates }
if (!(Test-Path "logs")) { mkdir logs }

# 启动服务
Write-Host "✅ 启动AI分析服务（最终版）..." -ForegroundColor Green
Write-Host ""
Write-Host "🎯 服务信息:" -ForegroundColor Cyan
Write-Host "   • AI服务: http://localhost:8000" -ForegroundColor White
Write-Host "   • API文档: http://localhost:8000/docs" -ForegroundColor White
Write-Host "   • 健康检查: http://localhost:8000/health" -ForegroundColor White
Write-Host "   • 服务模式: 精简版（7个核心API + 报告解读）" -ForegroundColor White
Write-Host ""
Write-Host "🤖 第三方AI服务:" -ForegroundColor Cyan
Write-Host "   • 提供商: 罗慕科技 (https://openapi-lab.ilmsmile.com.cn)" -ForegroundColor White
Write-Host "   • 当前状态: 模拟模式 (需要配置真实API密钥)" -ForegroundColor Yellow
Write-Host ""
Write-Host "📊 支持的分析类型:" -ForegroundColor Cyan
Write-Host "   🖼️  2D分析:" -ForegroundColor White
Write-Host "      • oral_classification - 口腔分类和自态摆正" -ForegroundColor Gray
Write-Host "      • cephalometric_57 - 头侧片分析" -ForegroundColor Gray
Write-Host "      • panoramic_segmentation - 全景片分析" -ForegroundColor Gray
Write-Host "      • lesion_detection - 面向口内分析" -ForegroundColor Gray
Write-Host ""
Write-Host "   🎲 3D分析:" -ForegroundColor White
Write-Host "      • model_downsampling_display - 模型降采样（显示版）" -ForegroundColor Gray
Write-Host "      • model_downsampling_segmentation - 降采样分牙" -ForegroundColor Gray
Write-Host "      • teeth_features - 牙齿特征值计算" -ForegroundColor Gray
Write-Host ""
Write-Host "📋 主要接口:" -ForegroundColor Cyan
Write-Host "   • 2D分析: POST /api/v1/analyze/2d" -ForegroundColor White
Write-Host "   • 3D分析: POST /api/v1/analyze/3d" -ForegroundColor White
Write-Host "   • 结果查询: GET /api/v1/analysis/{task_id}" -ForegroundColor White
Write-Host "   • 任务列表: GET /api/v1/analysis" -ForegroundColor White
Write-Host ""

try {
    python main-final.py
} catch {
    Write-Host "❌ AI服务启动失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "请检查Python环境和依赖是否正确安装" -ForegroundColor Yellow
}
