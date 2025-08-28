const express = require('express');
const cors = require('cors');

const app = express();

// 中间件
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// 日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 健康检查
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      api: 'running'
    }
  });
});

// 登录接口
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('Login attempt:', { email, password });
  
  // 测试账号
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
      username: email.split('@')[0],
      avatarUrl: null,
      phone: null,
      clinic: users[email].role === 'super_admin' ? null : {
        id: '1',
        name: '测试门诊',
        code: 'TEST001'
      }
    };
    
    console.log('Login successful:', userData);
    
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
  console.log('Auth me request, authorization:', auth);
  
  if (auth && auth.startsWith('Bearer ') && auth.includes('mock-jwt-token')) {
    const userData = {
      id: '1',
      email: 'super@admin.com',
      fullName: '超级管理员',
      role: 'super_admin',
      username: 'super',
      avatarUrl: null,
      phone: null,
      clinic: null
    };
    
    console.log('Auth me successful:', userData);
    
    res.json({
      success: true,
      data: {
        user: userData
      }
    });
  } else {
    console.log('Auth me failed - invalid token');
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
      completionRate: 80,
      activeClinics: 3,
      activeDoctors: 12
    }
  });
});

// 通用错误处理
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// 404处理
app.use((req, res) => {
  console.log('404 - Not found:', req.method, req.path);
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 ============================');
  console.log('✅ 简化后端服务启动成功!');
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
  console.log(`🔐 登录接口: http://localhost:${PORT}/api/auth/login`);
  console.log(`👤 用户信息: http://localhost:${PORT}/api/auth/me`);
  console.log('');
  console.log('🔑 测试账号:');
  console.log('   super@admin.com / admin123');
  console.log('   admin@clinic.com / admin123'); 
  console.log('   doctor@clinic.com / doctor123');
  console.log('   patient@example.com / patient123');
  console.log('🚀 ============================');
  console.log('');
  console.log('服务正在运行，等待请求...');
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到终止信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到中断信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
