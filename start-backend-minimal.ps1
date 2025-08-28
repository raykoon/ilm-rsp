# 最简化后端启动脚本
Write-Host "🚀 启动最小化后端服务..." -ForegroundColor Green

# 进入后端目录
Set-Location backend

# 设置环境变量
$env:NODE_ENV = "development"
$env:PORT = "3001"
$env:DATABASE_URL = "postgresql://postgres:postgres123@localhost:5432/ilm_rsp"
$env:JWT_SECRET = "your-super-secret-jwt-key-at-least-32-characters-long-for-production"

# 创建最小化服务器文件
$serverCode = @'
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
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      api: 'running'
    }
  });
});

// 模拟登录接口
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', email);
  
  // 简单的账号验证
  const users = {
    'super@admin.com': { role: 'super_admin', name: '超级管理员' },
    'admin@clinic.com': { role: 'admin', name: '门诊管理员' },
    'doctor@clinic.com': { role: 'doctor', name: '医生' },
    'patient@example.com': { role: 'patient', name: '患者' }
  };
  
  const validPasswords = ['admin123', 'doctor123', 'patient123'];
  
  if (users[email] && validPasswords.includes(password)) {
    const token = 'mock-jwt-token-' + Date.now();
    const userData = {
      id: Date.now().toString(),
      email: email,
      fullName: users[email].name,
      role: users[email].role,
      username: email.split('@')[0]
    };
    
    console.log('Login successful for:', email);
    
    res.json({
      success: true,
      data: {
        token: token,
        user: userData
      }
    });
  } else {
    console.log('Login failed for:', email);
    res.status(401).json({
      success: false,
      error: '邮箱或密码错误'
    });
  }
});

// 用户信息接口
app.get('/api/auth/me', (req, res) => {
  const auth = req.headers.authorization;
  
  if (auth && auth.startsWith('Bearer ') && auth.includes('mock-jwt-token')) {
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
    res.status(401).json({ 
      success: false, 
      error: '未授权' 
    });
  }
});

// 统计接口
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

// 错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// 启动服务
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, '0.0.0.0', () => {
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

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});
'@

# 写入服务器文件
$serverCode | Out-File -FilePath "server-minimal.js" -Encoding UTF8 -Force

# 检查Node.js
if (!(Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js 未安装或不在PATH中" -ForegroundColor Red
    exit 1
}

# 安装依赖 (如果需要)
if (!(Test-Path "node_modules/express")) {
    Write-Host "📦 安装基础依赖..." -ForegroundColor Yellow
    npm install express cors
}

Write-Host ""
Write-Host "🚀 启动最小化后端服务..." -ForegroundColor Green
Write-Host "📍 后端地址: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ 启动完成后，请在新终端运行前端:" -ForegroundColor Yellow
Write-Host "   cd frontend && npm run dev" -ForegroundColor Gray
Write-Host ""

# 启动最小化服务器
node server-minimal.js
