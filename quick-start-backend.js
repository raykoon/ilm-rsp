const http = require('http');
const url = require('url');

// 环境变量设置
process.env.NODE_ENV = 'development';
process.env.PORT = '3001';

console.log('🚀 设置环境变量...');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   PORT:', process.env.PORT);

// CORS处理函数
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Mock数据库
const mockDatabase = {
  users: [
    {
      id: '1', email: 'super@admin.com', password: 'admin123',
      fullName: '超级管理员', role: 'super_admin', username: 'super',
      avatarUrl: null, phone: null, clinicId: null
    },
    {
      id: '2', email: 'admin@clinic.com', password: 'admin123', 
      fullName: '门诊管理员', role: 'admin', username: 'admin',
      phone: '138****1234', clinicId: '1'
    },
    {
      id: '3', email: 'doctor@clinic.com', password: 'doctor123',
      fullName: '医生张三', role: 'doctor', username: 'doctor',
      phone: '139****5678', clinicId: '1'
    }
  ],
  
  clinics: [
    {
      id: '1', name: '北京儿童医院口腔科', code: 'BJK001',
      address: '北京市西城区南礼士路56号', phone: '010-59616161',
      email: 'contact@bjch-dental.com', status: 'active',
      createdAt: '2024-01-15T08:00:00Z', userCount: 15, patientCount: 120
    },
    {
      id: '2', name: '上海口腔医院', code: 'SHK002',
      address: '上海市黄浦区制造局路639号', phone: '021-63384600', 
      email: 'info@sh-dental.com', status: 'active',
      createdAt: '2024-02-01T08:00:00Z', userCount: 8, patientCount: 85
    }
  ],

  patients: [
    {
      id: '1', name: '张小明', gender: 'male', birthDate: '2018-03-15',
      guardianName: '张爸爸', guardianPhone: '138****1234', 
      address: '北京市朝阳区', status: 'active',
      createdAt: '2024-01-20T08:00:00Z', examinationCount: 3
    },
    {
      id: '2', name: '李小红', gender: 'female', birthDate: '2019-08-22',
      guardianName: '李妈妈', guardianPhone: '139****5678',
      address: '北京市海淀区', status: 'active', 
      createdAt: '2024-02-10T08:00:00Z', examinationCount: 2
    }
  ]
};

// 认证函数
function authenticateRequest(req) {
  const auth = req.headers.authorization;
  if (auth && (auth.startsWith('Bearer mock-jwt-token-') || auth.startsWith('Bearer '))) {
    return { id: '1', email: 'super@admin.com', role: 'super_admin' };
  }
  return null;
}

// HTTP服务器
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;
  const query = parsedUrl.query;

  setCORS(res);

  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${method} ${path}`);

  // 健康检查
  if (path === '/health' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      timestamp,
      services: { database: 'connected', api: 'running' },
      message: '增强版后端服务正常运行'
    }));
    return;
  }

  // 登录接口
  if (path === '/api/auth/login' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const { email, password } = JSON.parse(body);
        console.log('🔐 登录尝试:', { email });
        
        const user = mockDatabase.users.find(u => u.email === email && u.password === password);
        
        if (user) {
          const response = {
            success: true,
            data: {
              token: 'mock-jwt-token-' + Date.now(),
              user: {
                id: user.id, email: user.email, fullName: user.fullName,
                role: user.role, username: user.username, avatarUrl: user.avatarUrl,
                phone: user.phone,
                clinic: user.clinicId ? mockDatabase.clinics.find(c => c.id === user.clinicId) : null
              }
            }
          };
          
          console.log('✅ 登录成功:', email);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
        } else {
          console.log('❌ 登录失败:', email);
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: '邮箱或密码错误' }));
        }
      } catch (error) {
        console.error('登录请求解析失败:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: '请求格式错误' }));
      }
    });
    return;
  }

  // 用户信息接口
  if (path === '/api/auth/me' && method === 'GET') {
    const user = authenticateRequest(req);
    if (user) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          user: { id: user.id, email: user.email, fullName: '超级管理员', role: user.role, username: 'super' }
        }
      }));
    } else {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '未授权' }));
    }
    return;
  }

  // 门诊列表
  if (path === '/api/clinics' && method === 'GET') {
    const user = authenticateRequest(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '未授权' }));
      return;
    }

    const formattedClinics = mockDatabase.clinics.map(clinic => ({
      ...clinic,
      _count: { users: clinic.userCount, patients: clinic.patientCount }
    }));

    console.log(`📋 返回${formattedClinics.length}个门诊数据`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        clinics: formattedClinics,
        pagination: { total: formattedClinics.length, page: 1, limit: 20, totalPages: 1 }
      }
    }));
    return;
  }

  // 患者列表
  if (path === '/api/patients' && method === 'GET') {
    const user = authenticateRequest(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '未授权' }));
      return;
    }

    const formattedPatients = mockDatabase.patients.map(patient => ({
      ...patient,
      _count: { examinations: patient.examinationCount }
    }));

    console.log(`👥 返回${formattedPatients.length}个患者数据`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        patients: formattedPatients,
        pagination: { total: formattedPatients.length, page: 1, limit: 20, totalPages: 1 }
      }
    }));
    return;
  }

  // 统计数据
  if (path === '/api/stats/overview' && method === 'GET') {
    const user = authenticateRequest(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '未授权' }));
      return;
    }

    const stats = {
      totalPatients: mockDatabase.patients.length,
      totalExaminations: 15,
      completedReports: 12,
      pendingReports: 3,
      completionRate: 80.0,
      activeClinics: mockDatabase.clinics.length,
      activeDoctors: 3,
      todayExaminations: 5
    };

    console.log('📊 返回统计数据');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: stats }));
    return;
  }

  // 404处理
  console.log(`❌ 404 - 未找到: ${method} ${path}`);
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: false,
    error: `API端点未找到: ${method} ${path}`,
    availableEndpoints: [
      'GET /health', 'POST /api/auth/login', 'GET /api/auth/me',
      'GET /api/clinics', 'GET /api/patients', 'GET /api/stats/overview'
    ]
  }));
});

// 启动服务器
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 ============================');
  console.log('✅ 快速启动后端服务成功！');
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log('');
  console.log('🔗 完整API端点:');
  console.log('   ❤️  GET  /health - 健康检查');
  console.log('   🔐 POST /api/auth/login - 用户登录');
  console.log('   👤 GET  /api/auth/me - 用户信息');  
  console.log('   🏥 GET  /api/clinics - 门诊列表');
  console.log('   👥 GET  /api/patients - 患者列表');
  console.log('   📊 GET  /api/stats/overview - 统计数据');
  console.log('');
  console.log('🔑 测试账号:');
  console.log('   super@admin.com / admin123 (超级管理员)');
  console.log('   admin@clinic.com / admin123 (门诊管理员)');
  console.log('   doctor@clinic.com / doctor123 (医生)');
  console.log('🚀 ============================');
  console.log('');
  console.log('📊 实时请求日志:');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🔄 正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('🔄 收到终止信号，正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});
