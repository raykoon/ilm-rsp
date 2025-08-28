import { PrismaClient, UserRole, ReportStatus, AnalysisType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 开始创建种子数据...')

  // 创建超级管理员
  const adminPassword = await bcrypt.hash('admin123', 10)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@ilm-rsp.com' },
    update: {},
    create: {
      email: 'admin@ilm-rsp.com',
      username: 'super_admin',
      passwordHash: adminPassword,
      fullName: '系统管理员',
      role: UserRole.super_admin,
      phone: '13800138001',
    },
  })
  console.log('✅ 创建超级管理员:', superAdmin.fullName)

  // 创建示例门诊
  const clinic1 = await prisma.clinic.upsert({
    where: { code: 'DEMO_CLINIC_001' },
    update: {},
    create: {
      name: '阳光儿童口腔诊所',
      code: 'DEMO_CLINIC_001',
      address: '北京市朝阳区建国门外大街1号',
      phone: '010-12345678',
      contactPerson: '张医生',
      licenseNumber: 'MD-2024-001',
    },
  })

  const clinic2 = await prisma.clinic.upsert({
    where: { code: 'DEMO_CLINIC_002' },
    update: {},
    create: {
      name: '童趣口腔医院',
      code: 'DEMO_CLINIC_002',
      address: '上海市浦东新区陆家嘴环路1000号',
      phone: '021-87654321',
      contactPerson: '李主任',
      licenseNumber: 'MD-2024-002',
    },
  })
  console.log('✅ 创建示例门诊:', clinic1.name, clinic2.name)

  // 创建门诊管理员
  const clinicAdminPassword = await bcrypt.hash('admin123', 10)
  const clinicAdmin1 = await prisma.user.upsert({
    where: { email: 'admin1@clinic.com' },
    update: {},
    create: {
      email: 'admin1@clinic.com',
      username: 'clinic_admin_1',
      passwordHash: clinicAdminPassword,
      fullName: '张健康',
      role: UserRole.admin,
      phone: '13811112222',
      clinicId: clinic1.id,
    },
  })

  const clinicAdmin2 = await prisma.user.upsert({
    where: { email: 'admin2@clinic.com' },
    update: {},
    create: {
      email: 'admin2@clinic.com',
      username: 'clinic_admin_2',
      passwordHash: clinicAdminPassword,
      fullName: '李美丽',
      role: UserRole.admin,
      phone: '13822223333',
      clinicId: clinic2.id,
    },
  })
  console.log('✅ 创建门诊管理员:', clinicAdmin1.fullName, clinicAdmin2.fullName)

  // 创建医生用户
  const doctorPassword = await bcrypt.hash('doctor123', 10)
  const doctor1 = await prisma.user.upsert({
    where: { email: 'doctor1@clinic.com' },
    update: {},
    create: {
      email: 'doctor1@clinic.com',
      username: 'doctor_zhang',
      passwordHash: doctorPassword,
      fullName: '张口腔',
      role: UserRole.doctor,
      phone: '13833334444',
      clinicId: clinic1.id,
      medicalLicense: 'DOC-2024-001',
      specialty: '儿童口腔医学',
      title: '主治医师',
    },
  })

  const doctor2 = await prisma.user.upsert({
    where: { email: 'doctor2@clinic.com' },
    update: {},
    create: {
      email: 'doctor2@clinic.com',
      username: 'doctor_li',
      passwordHash: doctorPassword,
      fullName: '李正畸',
      role: UserRole.doctor,
      phone: '13844445555',
      clinicId: clinic2.id,
      medicalLicense: 'DOC-2024-002',
      specialty: '儿童正畸',
      title: '副主任医师',
    },
  })
  console.log('✅ 创建医生用户:', doctor1.fullName, doctor2.fullName)

  // 创建护士用户
  const nursePassword = await bcrypt.hash('nurse123', 10)
  const nurse1 = await prisma.user.upsert({
    where: { email: 'nurse1@clinic.com' },
    update: {},
    create: {
      email: 'nurse1@clinic.com',
      username: 'nurse_wang',
      passwordHash: nursePassword,
      fullName: '王护士',
      role: UserRole.nurse,
      phone: '13855556666',
      clinicId: clinic1.id,
    },
  })
  console.log('✅ 创建护士用户:', nurse1.fullName)

  // 创建示例患者
  const patientPassword = await bcrypt.hash('patient123', 10)
  const patient1 = await prisma.user.upsert({
    where: { email: 'patient1@example.com' },
    update: {},
    create: {
      email: 'patient1@example.com',
      username: 'patient_xiaoming',
      passwordHash: patientPassword,
      fullName: '小明',
      role: UserRole.patient,
      phone: '13866667777',
      birthDate: new Date('2015-05-15'),
      gender: '男',
      guardianName: '明爸爸',
      guardianPhone: '13877778888',
      emergencyContact: '明妈妈',
      emergencyPhone: '13888889999',
    },
  })

  const patient2 = await prisma.user.upsert({
    where: { email: 'patient2@example.com' },
    update: {},
    create: {
      email: 'patient2@example.com',
      username: 'patient_xiaohong',
      passwordHash: patientPassword,
      fullName: '小红',
      role: UserRole.patient,
      phone: '13899990000',
      birthDate: new Date('2016-08-20'),
      gender: '女',
      guardianName: '红妈妈',
      guardianPhone: '13900001111',
      emergencyContact: '红爸爸',
      emergencyPhone: '13911112222',
    },
  })
  console.log('✅ 创建示例患者:', patient1.fullName, patient2.fullName)

  // 为患者创建详细档案
  await prisma.patientProfile.upsert({
    where: { patientId: patient1.id },
    update: {},
    create: {
      patientId: patient1.id,
      height: 120.5,
      weight: 25.0,
      bloodType: 'A+',
      allergies: '无已知过敏',
      medicalHistory: '无重大疾病史',
      dentalHistory: '6岁开始换牙，目前换牙正常',
      habits: '偶尔吮手指，正在改正',
    },
  })

  await prisma.patientProfile.upsert({
    where: { patientId: patient2.id },
    update: {},
    create: {
      patientId: patient2.id,
      height: 115.0,
      weight: 22.5,
      bloodType: 'O+',
      allergies: '对青霉素过敏',
      medicalHistory: '幼儿期患过肺炎，已痊愈',
      dentalHistory: '乳牙龋齿已治疗，换牙期',
      habits: '喜欢咬笔头，需要注意',
    },
  })
  console.log('✅ 创建患者档案')

  // 创建检查模板
  const template1 = await prisma.examinationTemplate.upsert({
    where: { id: 'template-basic-screening' },
    update: {},
    create: {
      id: 'template-basic-screening',
      clinicId: clinic1.id,
      name: '儿童口腔基础筛查',
      description: '适用于6-12岁儿童的基础口腔健康筛查',
      requiredImages: {
        types: ['intraoral', 'facial'],
        intraoral: ['正面', '左侧', '右侧', '上颌', '下颌'],
        facial: ['正面微笑', '侧面轮廓']
      },
      analysisConfig: {
        aiModels: ['caries_detection', 'alignment_analysis'],
        thresholds: { confidence: 0.8 }
      },
      price: 280.00,
    },
  })

  const template2 = await prisma.examinationTemplate.upsert({
    where: { id: 'template-orthodontic' },
    update: {},
    create: {
      id: 'template-orthodontic',
      clinicId: clinic2.id,
      name: '正畸评估套餐',
      description: '全方位正畸治疗前评估',
      requiredImages: {
        types: ['intraoral', 'facial', 'cephalometric', 'panoramic'],
        comprehensive: true
      },
      analysisConfig: {
        aiModels: ['alignment_analysis', 'growth_prediction', 'facial_analysis'],
        thresholds: { confidence: 0.85 }
      },
      price: 680.00,
    },
  })
  console.log('✅ 创建检查模板:', template1.name, template2.name)

  // 创建系统配置
  const systemConfigs = [
    {
      configKey: 'ai_analysis_timeout',
      configValue: { seconds: 300 },
      configType: 'number',
      description: 'AI分析超时时间（秒）',
    },
    {
      configKey: 'report_auto_generation',
      configValue: { enabled: true, delay_minutes: 5 },
      configType: 'boolean',
      description: '报告自动生成设置',
    },
    {
      configKey: 'file_upload_limits',
      configValue: {
        maxSize: '50MB',
        allowedTypes: ['.jpg', '.jpeg', '.png', '.dcm', '.tiff'],
        maxFiles: 20
      },
      configType: 'object',
      description: '文件上传限制配置',
    },
  ]

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { configKey: config.configKey },
      update: {},
      create: config,
    })
  }
  console.log('✅ 创建系统配置')

  // 创建示例检查记录
  const examination1 = await prisma.examination.create({
    data: {
      patientId: patient1.id,
      doctorId: doctor1.id,
      clinicId: clinic1.id,
      templateId: template1.id,
      chiefComplaint: '家长发现孩子牙齿有黑点，担心是蛀牙',
      presentIllness: '近2个月发现上门牙有黑色斑点，无疼痛',
      clinicalFindings: '上门牙唇面可见浅龋，探诊无明显疼痛',
      preliminaryDiagnosis: '上中切牙龋齿',
      status: ReportStatus.pending,
      notes: '建议进行充填治疗',
    },
  })
  console.log('✅ 创建示例检查记录:', examination1.id)

  console.log('🎉 种子数据创建完成!')
  console.log('')
  console.log('📋 测试账号信息:')
  console.log('超级管理员: admin@ilm-rsp.com / admin123')
  console.log('门诊管理员: admin1@clinic.com / admin123')
  console.log('医生账号: doctor1@clinic.com / doctor123')
  console.log('护士账号: nurse1@clinic.com / nurse123')
  console.log('患者账号: patient1@example.com / patient123')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ 种子数据创建失败:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
