const http = require('http');
const url = require('url');

// 简单的CORS处理
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;

  // 设置CORS
  setCORS(res);

  // 处理OPTIONS请求
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`${new Date().toISOString()} - ${method} ${path}`);

  // 健康检查
  if (path === '/health' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'running'
      }
    }));
    return;
  }

  // 登录接口
  if (path === '/api/auth/login' && method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { email, password } = data;
        
        console.log('登录尝试:', { email, password });

        // 简单验证
        const users = {
          'super@admin.com': { role: 'super_admin', name: '超级管理员' },
          'admin@clinic.com': { role: 'admin', name: '门诊管理员' },
          'doctor@clinic.com': { role: 'doctor', name: '医生' },
          'patient@example.com': { role: 'patient', name: '患者' }
        };

        const validPasswords = ['admin123', 'doctor123', 'patient123'];

        if (users[email] && validPasswords.includes(password)) {
          const response = {
            success: true,
            data: {
              token: 'mock-jwt-token-' + Date.now(),
              user: {
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
              }
            }
          };

          console.log('登录成功:', email);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } else {
          console.log('登录失败:', email);
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            error: '邮箱或密码错误'
          }));
        }
      } catch (error) {
        console.error('解析请求失败:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: '请求格式错误'
        }));
      }
    });
    return;
  }

  // 用户信息接口
  if (path === '/api/auth/me' && method === 'GET') {
    const auth = req.headers.authorization;
    
    if (auth && auth.startsWith('Bearer ') && auth.includes('mock-jwt-token')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
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
      }));
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '未授权'
      }));
    }
    return;
  }

  // 统计接口
  if (path === '/api/stats/overview' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        totalExaminations: 10,
        totalPatients: 5,
        totalReports: 8,
        pendingReports: 2,
        completionRate: 80
      }
    }));
    return;
  }

  // 404处理
  console.log(`404 - 未找到路径: ${method} ${path}`);
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: false,
    error: 'API端点未找到'
  }));
});

// 启动服务器
const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 ============================');
  console.log('✅ 超简单后端服务启动成功!');
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
  console.log('📊 实时请求日志:');
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
  console.log('\n收到中断信号，正在关闭服务器...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
