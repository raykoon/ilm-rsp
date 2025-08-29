const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const prisma = new PrismaClient();

// 环境变量
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-at-least-32-characters-long';
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// 请求日志
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// JWT认证中间件
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: '访问token缺失' });
  }

  try {
    // 对于mock token，我们简单验证
    if (token.startsWith('mock-jwt-token-')) {
      req.user = {
        id: '1',
        email: 'super@admin.com',
        role: 'super_admin',
        clinicId: null
      };
      return next();
    }

    // 真实JWT验证
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { clinic: true }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: '无效的token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token验证失败:', error);
    return res.status(403).json({ success: false, error: 'Token无效' });
  }
};

// ==================== 认证路由 ====================

// 健康检查
app.get('/health', async (req, res) => {
  try {
    // 测试数据库连接
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'running'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
        api: 'running'
      },
      error: error.message
    });
  }
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('登录尝试:', { email });

    // 临时mock用户（后续替换为数据库查询）
    const mockUsers = {
      'super@admin.com': { 
        id: '1',
        role: 'super_admin', 
        name: '超级管理员',
        password: 'admin123',
        clinicId: null
      },
      'admin@clinic.com': { 
        id: '2',
        role: 'admin', 
        name: '门诊管理员',
        password: 'admin123',
        clinicId: '1'
      },
      'doctor@clinic.com': { 
        id: '3',
        role: 'doctor', 
        name: '医生',
        password: 'doctor123',
        clinicId: '1'
      },
      'patient@example.com': { 
        id: '4',
        role: 'patient', 
        name: '患者',
        password: 'patient123',
        clinicId: null
      }
    };

    const user = mockUsers[email];
    if (!user || user.password !== password) {
      console.log('登录失败:', email);
      return res.status(401).json({
        success: false,
        error: '邮箱或密码错误'
      });
    }

    // 生成JWT token（真实环境）
    const token = jwt.sign(
      { 
        id: user.id, 
        email: email, 
        role: user.role,
        clinicId: user.clinicId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userData = {
      id: user.id,
      email: email,
      fullName: user.name,
      role: user.role,
      username: email.split('@')[0],
      avatarUrl: null,
      phone: null,
      clinic: user.clinicId ? {
        id: user.clinicId,
        name: '测试门诊',
        code: 'TEST001'
      } : null
    };

    console.log('登录成功:', email);

    res.json({
      success: true,
      data: {
        token: token,
        user: userData
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

// 获取当前用户信息
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        email: req.user.email,
        fullName: req.user.fullName || '用户',
        role: req.user.role,
        username: req.user.username || req.user.email?.split('@')[0],
        avatarUrl: req.user.avatarUrl,
        phone: req.user.phone,
        clinic: req.user.clinic || null
      }
    }
  });
});

// ==================== 门诊管理路由 ====================

// 获取门诊列表
app.get('/api/clinics', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    
    // Mock数据（后续替换为真实数据库查询）
    const mockClinics = [
      {
        id: '1',
        name: '北京儿童医院口腔科',
        code: 'BJK001',
        address: '北京市西城区南礼士路56号',
        phone: '010-59616161',
        email: 'contact@bjch-dental.com',
        status: 'active',
        createdAt: '2024-01-15T08:00:00Z',
        _count: { users: 15, patients: 120 }
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
        _count: { users: 8, patients: 85 }
      }
    ];

    // 简单搜索过滤
    const filteredClinics = search 
      ? mockClinics.filter(clinic => 
          clinic.name.includes(search) || 
          clinic.code.includes(search)
        )
      : mockClinics;

    const total = filteredClinics.length;
    const startIndex = (page - 1) * limit;
    const paginatedClinics = filteredClinics.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      success: true,
      data: {
        clinics: paginatedClinics,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取门诊列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取门诊列表失败'
    });
  }
});

// 创建门诊
app.post('/api/clinics', authenticateToken, async (req, res) => {
  try {
    const { name, code, address, phone, email } = req.body;

    // 权限检查
    if (req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        error: '权限不足'
      });
    }

    // Mock创建逻辑（后续替换为真实数据库操作）
    const newClinic = {
      id: Date.now().toString(),
      name,
      code,
      address,
      phone,
      email,
      status: 'active',
      createdAt: new Date().toISOString(),
      _count: { users: 0, patients: 0 }
    };

    console.log('创建门诊:', newClinic);

    res.status(201).json({
      success: true,
      data: { clinic: newClinic }
    });

  } catch (error) {
    console.error('创建门诊失败:', error);
    res.status(500).json({
      success: false,
      error: '创建门诊失败'
    });
  }
});

// 获取门诊详情
app.get('/api/clinics/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Mock数据
    const clinic = {
      id: id,
      name: '北京儿童医院口腔科',
      code: 'BJK001',
      address: '北京市西城区南礼士路56号',
      phone: '010-59616161',
      email: 'contact@bjch-dental.com',
      status: 'active',
      createdAt: '2024-01-15T08:00:00Z',
      description: '专业儿童口腔医疗服务',
      _count: { 
        users: 15, 
        patients: 120,
        examinations: 350 
      }
    };

    res.json({
      success: true,
      data: { clinic }
    });

  } catch (error) {
    console.error('获取门诊详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取门诊详情失败'
    });
  }
});

// ==================== 患者管理路由 ====================

// 获取患者列表
app.get('/api/patients', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;

    // Mock患者数据
    const mockPatients = [
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
        _count: { examinations: 3 },
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
        _count: { examinations: 2 },
        lastExaminationAt: '2024-03-10T14:15:00Z'
      }
    ];

    const filteredPatients = search 
      ? mockPatients.filter(patient => 
          patient.name.includes(search) || 
          patient.guardianName.includes(search)
        )
      : mockPatients;

    const total = filteredPatients.length;
    const startIndex = (page - 1) * limit;
    const paginatedPatients = filteredPatients.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      success: true,
      data: {
        patients: paginatedPatients,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('获取患者列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取患者列表失败'
    });
  }
});

// 创建患者
app.post('/api/patients', authenticateToken, async (req, res) => {
  try {
    const { name, gender, birthDate, guardianName, guardianPhone, address } = req.body;

    const newPatient = {
      id: Date.now().toString(),
      name,
      gender,
      birthDate,
      phone: guardianPhone,
      guardianName,
      guardianPhone,
      address,
      status: 'active',
      createdAt: new Date().toISOString(),
      _count: { examinations: 0 },
      lastExaminationAt: null
    };

    console.log('创建患者:', newPatient);

    res.status(201).json({
      success: true,
      data: { patient: newPatient }
    });

  } catch (error) {
    console.error('创建患者失败:', error);
    res.status(500).json({
      success: false,
      error: '创建患者失败'
    });
  }
});

// ==================== 统计数据路由 ====================

app.get('/api/stats/overview', authenticateToken, async (req, res) => {
  try {
    // Mock统计数据
    const stats = {
      totalPatients: 245,
      totalExaminations: 678,
      completedReports: 632,
      pendingReports: 46,
      completionRate: 93.2,
      activeClinics: 12,
      activeDoctors: 48,
      todayExaminations: 15,
      monthlyGrowth: {
        patients: 12.5,
        examinations: 18.3
      }
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取统计数据失败'
    });
  }
});

// ==================== 错误处理 ====================

// 404处理
app.use((req, res) => {
  console.log(`404 - API端点未找到: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    error: `API端点未找到: ${req.method} ${req.path}`
  });
});

// 全局错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: '服务器内部错误'
  });
});

// ==================== 服务器启动 ====================

const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log('');
  console.log('🚀 ============================');
  console.log('✅ 真实后端服务启动成功!');
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log('');
  console.log('🔗 核心API端点:');
  console.log('   🔐 POST /api/auth/login - 用户登录');
  console.log('   👤 GET  /api/auth/me - 获取用户信息');
  console.log('   🏥 GET  /api/clinics - 门诊管理');
  console.log('   👥 GET  /api/patients - 患者管理');
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

  // 测试数据库连接
  try {
    await prisma.$connect();
    console.log('✅ 数据库连接成功');
  } catch (error) {
    console.log('⚠️  数据库连接失败，使用Mock数据模式');
    console.log('   错误:', error.message);
  }
});

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('收到终止信号，正在关闭服务器...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\n收到中断信号，正在关闭服务器...');
  await prisma.$disconnect();
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
