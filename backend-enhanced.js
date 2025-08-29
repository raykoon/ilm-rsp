const http = require('http');
const url = require('url');

// 修复的CORS处理 - 支持withCredentials
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000'); // 具体域名，不能用*
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Mock数据库
const mockData = {
  users: [
    {
      id: '1',
      email: 'super@admin.com',
      password: 'admin123',
      fullName: '超级管理员',
      role: 'super_admin',
      username: 'super',
      avatarUrl: null,
      phone: null,
      clinicId: null
    },
    {
      id: '2', 
      email: 'admin@clinic.com',
      password: 'admin123',
      fullName: '门诊管理员',
      role: 'admin',
      username: 'admin',
      phone: '138****1234',
      clinicId: '1'
    },
    {
      id: '3',
      email: 'doctor@clinic.com', 
      password: 'doctor123',
      fullName: '医生',
      role: 'doctor',
      username: 'doctor',
      phone: '139****5678',
      clinicId: '1'
    }
  ],
  
  clinics: [
    {
      id: '1',
      name: '北京儿童医院口腔科',
      code: 'BJK001',
      address: '北京市西城区南礼士路56号',
      phone: '010-59616161',
      email: 'contact@bjch-dental.com',
      status: 'active',
      createdAt: '2024-01-15T08:00:00Z',
      description: '专业儿童口腔医疗服务',
      userCount: 15,
      patientCount: 120,
      examinationCount: 350
    },
    {
      id: '2',
      name: '上海口腔医院',
      code: 'SHK002', 
      address: '上海市黄浦区制造局路639号',
      phone: '021-63384600',
      email: 'info@sh-dental.com',
      status: 'active',
      createdAt: '2024-02-01T08:00:00Z',
      description: '综合口腔医疗服务',
      userCount: 8,
      patientCount: 85,
      examinationCount: 220
    }
  ],
  
  patients: [
    {
      id: '1',
      name: '张小明',
      gender: 'male',
      birthDate: '2018-03-15',
      phone: '138****1234',
      guardianName: '张爸爸',
      guardianPhone: '138****1234',
      address: '北京市朝阳区',
      status: 'active',
      createdAt: '2024-01-20T08:00:00Z',
      clinicId: '1',
      examinationCount: 3,
      lastExaminationAt: '2024-03-15T10:30:00Z'
    },
    {
      id: '2',
      name: '李小红',
      gender: 'female',
      birthDate: '2019-08-22', 
      phone: '139****5678',
      guardianName: '李妈妈',
      guardianPhone: '139****5678',
      address: '北京市海淀区',
      status: 'active',
      createdAt: '2024-02-10T08:00:00Z',
      clinicId: '1',
      examinationCount: 2,
      lastExaminationAt: '2024-03-10T14:15:00Z'
    }
  ],
  
  examinations: [
    {
      id: '1',
      patientId: '1',
      patientName: '张小明',
      patientAge: 6,
      patientGender: 'male',
      doctorId: '3',
      doctorName: '医生张三',
      clinicId: '1',
      type: 'oral_photos',
      status: 'completed',
      aiAnalysisStatus: 'completed',
      createdAt: '2024-03-15T10:30:00Z',
      completedAt: '2024-03-15T11:15:00Z',
      notes: '口内照片检查，牙齿发育正常',
      filesCount: 3,
      analysisResults: {
        problems: ['轻微牙菌斑'],
        recommendations: ['建议定期清洁']
      }
    },
    {
      id: '2',
      patientId: '2',
      patientName: '李小红',
      patientAge: 5,
      patientGender: 'female',
      doctorId: '3',
      doctorName: '医生张三',
      clinicId: '1',
      type: 'panoramic_xray',
      status: 'in_progress',
      aiAnalysisStatus: 'analyzing',
      createdAt: '2024-03-20T14:00:00Z',
      completedAt: null,
      notes: '全景X光检查',
      filesCount: 1,
      analysisResults: null
    },
    {
      id: '3',
      patientId: '1',
      patientName: '张小明',
      patientAge: 6,
      patientGender: 'male',
      doctorId: '3',
      doctorName: '医生张三',
      clinicId: '1',
      type: 'cephalometric',
      status: 'pending',
      aiAnalysisStatus: 'waiting',
      createdAt: '2024-03-21T09:00:00Z',
      completedAt: null,
      notes: '头颅侧位片分析',
      filesCount: 1,
      analysisResults: null
    },
    {
      id: '4',
      patientId: '2',
      patientName: '李小红',
      patientAge: 5,
      patientGender: 'female',
      doctorId: '3',
      doctorName: '医生张三',
      clinicId: '1',
      type: '3d_model',
      status: 'failed',
      aiAnalysisStatus: 'failed',
      createdAt: '2024-03-18T16:30:00Z',
      completedAt: null,
      notes: '3D模型分析失败，文件格式问题',
      filesCount: 1,
      analysisResults: null
    }
  ]
};

// 认证检查
function authenticateRequest(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  
  // 支持mock token或真实JWT
  if (auth.startsWith('Bearer mock-jwt-token-') || auth.startsWith('Bearer ')) {
    return {
      id: '1',
      email: 'super@admin.com',
      role: 'super_admin'
    };
  }
  
  return null;
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const method = req.method;
  const query = parsedUrl.query;

  // 设置CORS
  setCORS(res);

  // 处理OPTIONS请求
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`${new Date().toISOString()} - ${method} ${path}`);

  // ==================== 认证API ====================
  
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
        
        console.log('登录尝试:', { email });

        const user = mockData.users.find(u => u.email === email && u.password === password);
        
        if (user) {
          const response = {
            success: true,
            data: {
              token: 'mock-jwt-token-' + Date.now(),
              user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                username: user.username,
                avatarUrl: user.avatarUrl,
                phone: user.phone,
                clinic: user.clinicId ? mockData.clinics.find(c => c.id === user.clinicId) : null
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
        console.error('解析登录请求失败:', error);
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
    const user = authenticateRequest(req);
    
    if (user) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: '超级管理员',
            role: user.role,
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

  // ==================== 门诊管理API ====================
  
  // 获取门诊列表
  if (path === '/api/clinics' && method === 'GET') {
    const user = authenticateRequest(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '未授权' }));
      return;
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const search = query.search || '';

    let clinics = [...mockData.clinics];
    
    // 搜索过滤
    if (search) {
      clinics = clinics.filter(clinic => 
        clinic.name.includes(search) || 
        clinic.code.includes(search)
      );
    }

    const total = clinics.length;
    const startIndex = (page - 1) * limit;
    const paginatedClinics = clinics.slice(startIndex, startIndex + limit);

    // 格式化响应数据
    const formattedClinics = paginatedClinics.map(clinic => ({
      ...clinic,
      _count: {
        users: clinic.userCount,
        patients: clinic.patientCount,
        examinations: clinic.examinationCount
      }
    }));

    console.log(`返回${formattedClinics.length}个门诊数据`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        clinics: formattedClinics,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    }));
    return;
  }

  // 创建门诊
  if (path === '/api/clinics' && method === 'POST') {
    const user = authenticateRequest(req);
    if (!user || user.role !== 'super_admin') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '权限不足' }));
      return;
    }

    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { name, code, address, phone, email } = data;

        const newClinic = {
          id: (mockData.clinics.length + 1).toString(),
          name,
          code,
          address,
          phone,
          email,
          status: 'active',
          createdAt: new Date().toISOString(),
          description: '',
          userCount: 0,
          patientCount: 0,
          examinationCount: 0
        };

        mockData.clinics.push(newClinic);

        console.log('创建门诊:', newClinic);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: { clinic: newClinic }
        }));
      } catch (error) {
        console.error('创建门诊失败:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: '请求格式错误'
        }));
      }
    });
    return;
  }

  // ==================== 患者管理API ====================
  
  // 获取患者列表
  if (path === '/api/patients' && method === 'GET') {
    const user = authenticateRequest(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '未授权' }));
      return;
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const search = query.search || '';

    let patients = [...mockData.patients];
    
    // 搜索过滤
    if (search) {
      patients = patients.filter(patient => 
        patient.name.includes(search) || 
        patient.guardianName.includes(search)
      );
    }

    const total = patients.length;
    const startIndex = (page - 1) * limit;
    const paginatedPatients = patients.slice(startIndex, startIndex + limit);

    // 格式化响应数据
    const formattedPatients = paginatedPatients.map(patient => ({
      ...patient,
      _count: {
        examinations: patient.examinationCount
      }
    }));

    console.log(`返回${formattedPatients.length}个患者数据`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        patients: formattedPatients,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    }));
    return;
  }

  // ==================== 统计数据API ====================
  
  // 总体统计
  if (path === '/api/stats/overview' && method === 'GET') {
    const user = authenticateRequest(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '未授权' }));
      return;
    }

    const stats = {
      totalPatients: mockData.patients.length,
      totalExaminations: mockData.examinations.length,
      completedReports: mockData.examinations.filter(e => e.reportStatus === 'generated').length,
      pendingReports: mockData.examinations.filter(e => e.reportStatus === 'pending').length,
      completionRate: 85.0,
      activeClinics: mockData.clinics.filter(c => c.status === 'active').length,
      activeDoctors: mockData.users.filter(u => u.role === 'doctor').length,
      todayExaminations: 5,
      monthlyGrowth: {
        patients: 12.5,
        examinations: 18.3
      }
    };

    console.log('返回统计数据');

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: stats
    }));
    return;
  }

  // ==================== 检查记录API ====================
  
  // 获取检查记录列表
  if (path === '/api/examinations' && method === 'GET') {
    const user = authenticateRequest(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '未授权' }));
      return;
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;

    let examinations = [...mockData.examinations];

    const total = examinations.length;
    const startIndex = (page - 1) * limit;
    const paginatedExaminations = examinations.slice(startIndex, startIndex + limit);

    // 关联患者和医生信息
    const formattedExaminations = paginatedExaminations.map(exam => {
      const patient = mockData.patients.find(p => p.id === exam.patientId);
      const doctor = mockData.users.find(u => u.id === exam.doctorId);
      const clinic = mockData.clinics.find(c => c.id === exam.clinicId);

      return {
        ...exam,
        patient: patient ? {
          id: patient.id,
          name: patient.name,
          gender: patient.gender,
          birthDate: patient.birthDate
        } : null,
        doctor: doctor ? {
          id: doctor.id,
          fullName: doctor.fullName
        } : null,
        clinic: clinic ? {
          id: clinic.id,
          name: clinic.name,
          code: clinic.code
        } : null
      };
    });

    console.log(`返回${formattedExaminations.length}个检查记录`);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: {
        examinations: formattedExaminations,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    }));
    return;
  }

  // 创建检查记录
  if (path === '/api/examinations' && method === 'POST') {
    const user = authenticateRequest(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '未授权' }));
      return;
    }

    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        const examData = JSON.parse(body);
        console.log('创建检查请求:', examData);

        // 验证必填字段
        if (!examData.patientId || !examData.type) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: '缺少必填字段' }));
          return;
        }

        // 查找患者信息
        const patient = mockData.patients.find(p => p.id === examData.patientId);
        if (!patient) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: '患者不存在' }));
          return;
        }

        // 计算患者年龄
        const birthYear = new Date(patient.birthDate).getFullYear();
        const currentYear = new Date().getFullYear();
        const age = currentYear - birthYear;

        // 创建新的检查记录
        const newExamination = {
          id: (mockData.examinations.length + 1).toString(),
          patientId: examData.patientId,
          patientName: patient.name,
          patientAge: age,
          patientGender: patient.gender,
          doctorId: user.id,
          doctorName: user.fullName || '医生',
          clinicId: user.clinicId || '1',
          type: examData.type,
          status: 'pending',
          aiAnalysisStatus: 'waiting',
          createdAt: new Date().toISOString(),
          completedAt: null,
          notes: examData.notes || '',
          filesCount: examData.files ? examData.files.length : 0,
          analysisResults: null
        };

        // 添加到模拟数据中
        mockData.examinations.push(newExamination);

        console.log('检查创建成功:', newExamination.id);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          data: {
            examination: newExamination,
            message: '检查创建成功，AI分析将在后台进行'
          }
        }));
      } catch (error) {
        console.error('创建检查失败:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: '请求格式错误' }));
      }
    });
    return;
  }

  // 获取检查统计信息
  if (path === '/api/examinations/stats' && method === 'GET') {
    const user = authenticateRequest(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: '未授权' }));
      return;
    }

    const examinations = mockData.examinations;
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    // 计算统计数据
    const stats = {
      total: examinations.length,
      pending: examinations.filter(e => e.status === 'pending').length,
      inProgress: examinations.filter(e => e.status === 'in_progress' || e.aiAnalysisStatus === 'analyzing').length,
      completed: examinations.filter(e => e.status === 'completed' && e.aiAnalysisStatus === 'completed').length,
      todayTotal: examinations.filter(e => e.createdAt.startsWith(todayString)).length,
      failed: examinations.filter(e => e.status === 'failed' || e.aiAnalysisStatus === 'failed').length
    };

    console.log('返回检查统计:', stats);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      data: stats
    }));
    return;
  }

  // 404处理
  console.log(`404 - API端点未找到: ${method} ${path}`);
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: false,
    error: `API端点未找到: ${method} ${path}`,
    availableEndpoints: [
      'GET /health',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /api/clinics',
      'POST /api/clinics',
      'GET /api/patients',
      'GET /api/examinations',
      'POST /api/examinations',
      'GET /api/examinations/stats',
      'GET /api/stats/overview'
    ]
  }));
});

// 启动服务器
const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('🚀 ============================');
  console.log('✅ 增强版真实后端服务启动成功!');
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log('');
  console.log('🔗 完整API端点列表:');
  console.log('   🔐 POST /api/auth/login - 用户登录');
  console.log('   👤 GET  /api/auth/me - 获取用户信息');
  console.log('   🏥 GET  /api/clinics - 门诊列表');
  console.log('   🏥 POST /api/clinics - 创建门诊');
  console.log('   👥 GET  /api/patients - 患者列表');
  console.log('   📋 GET  /api/examinations - 检查记录');
  console.log('   📋 POST /api/examinations - 创建检查');
  console.log('   📊 GET  /api/examinations/stats - 检查统计');
  console.log('   📊 GET  /api/stats/overview - 统计数据');
  console.log('   ❤️  GET  /health - 健康检查');
  console.log('');
  console.log('🔑 测试账号:');
  console.log('   超级管理员: super@admin.com / admin123');
  console.log('   门诊管理员: admin@clinic.com / admin123');
  console.log('   医生: doctor@clinic.com / doctor123');
  console.log('   患者: patient@example.com / patient123');
  console.log('🚀 ============================');
  console.log('');
  console.log('📊 实时API请求日志:');
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
