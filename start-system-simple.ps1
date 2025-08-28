# 简化系统启动脚本
Write-Host "🚀 启动儿童口腔筛查平台（简化版）" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green

# 1. 启动Docker基础服务
Write-Host "📦 启动基础服务..." -ForegroundColor Yellow
docker-compose -f docker-compose.services.yml up -d

# 等待服务启动
Write-Host "⏳ 等待基础服务启动..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 2. 准备后端
Write-Host "🔧 准备后端环境..." -ForegroundColor Yellow
Set-Location backend

# 设置基本环境变量
$env:NODE_ENV = "development"
$env:PORT = "3001"
$env:DATABASE_URL = "postgresql://postgres:postgres123@localhost:5432/ilm_rsp"
$env:JWT_SECRET = "your-super-secret-jwt-key-at-least-32-characters-long-for-production-use"

# 检查依赖
if (!(Test-Path "node_modules/@prisma")) {
    Write-Host "📦 安装必要依赖..." -ForegroundColor Yellow
    npm install @prisma/client prisma
}

# 快速数据库设置
Write-Host "🗄️  快速设置数据库..." -ForegroundColor Yellow
try {
    npx prisma db push --accept-data-loss
    npx prisma generate
} catch {
    Write-Host "   数据库设置可能需要手动处理" -ForegroundColor Yellow
}

# 创建最小化服务器文件
Write-Host "🛠️  创建最小化服务器..." -ForegroundColor Yellow

$minServerCode = @'
const express = require('express');
const cors = require('cors');

const app = express();

// 中间件
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 模拟登录接口
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // 简单的账号验证
  const users = {
    'super@admin.com': { role: 'super_admin', name: '超级管理员' },
    'admin@clinic.com': { role: 'admin', name: '门诊管理员' },
    'doctor@clinic.com': { role: 'doctor', name: '医生' },
    'patient@example.com': { role: 'patient', name: '患者' }
  };
  
  if (users[email] && password === 'admin123' || password === 'doctor123' || password === 'patient123') {
    res.json({
      success: true,
      data: {
        token: 'mock-jwt-token-' + Date.now(),
        user: {
          id: Date.now().toString(),
          email: email,
          fullName: users[email].name,
          role: users[email].role,
          username: email.split('@')[0]
        }
      }
    });
  } else {
    res.status(401).json({
      success: false,
      error: '邮箱或密码错误'
    });
  }
});

// 用户信息接口
app.get('/api/auth/me', (req, res) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    res.json({
      success: true,
      data: {
        user: {
          id: '1',
          email: 'super@admin.com',
          fullName: '超级管理员',
          role: 'super_admin',
          username: 'super'
        }
      }
    });
  } else {
    res.status(401).json({ success: false, error: '未授权' });
  }
});

// 其他接口模拟
app.get('/api/stats/overview', (req, res) => {
  res.json({
    success: true,
    data: {
      totalExaminations: 10,
      totalPatients: 5,
      totalReports: 8,
      pendingReports: 2,
      completionRate: 80
    }
  });
});

// 启动服务
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ============================');
  console.log('✅ 后端服务启动成功!');
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
  console.log(`🔐 登录接口: http://localhost:${PORT}/api/auth/login`);
  console.log('');
  console.log('🔑 测试账号:');
  console.log('   super@admin.com / admin123');
  console.log('   admin@clinic.com / admin123'); 
  console.log('   doctor@clinic.com / doctor123');
  console.log('   patient@example.com / patient123');
  console.log('🚀 ============================');
  console.log('');
});
'@

$minServerCode | Out-File -FilePath "server-minimal.js" -Encoding UTF8

Write-Host ""
Write-Host "🚀 启动最小化后端服务..." -ForegroundColor Green
Write-Host "📍 后端地址: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ 启动完成后，请在新终端运行前端:" -ForegroundColor Yellow
Write-Host "   .\start-frontend-fixed.ps1" -ForegroundColor Gray
Write-Host ""

# 启动最小化服务器
node server-minimal.js
