-- 儿童口腔快速筛查报告平台数据库初始化脚本
-- 创建时间: 2024年

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 创建用户角色枚举
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'doctor', 'nurse', 'patient');

-- 创建报告状态枚举
CREATE TYPE report_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'reviewed');

-- 创建分析类型枚举
CREATE TYPE analysis_type AS ENUM ('intraoral', 'facial', 'cephalometric', 'panoramic', '3d_model');

-- 机构/门诊表
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- 机构编码
    address TEXT,
    phone VARCHAR(20),
    contact_person VARCHAR(100),
    license_number VARCHAR(100), -- 营业执照号
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 用户表（医生、护士、患者、管理员）
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    clinic_id UUID REFERENCES clinics(id),
    
    -- 个人信息
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    
    -- 医生专用字段
    medical_license VARCHAR(100), -- 医师执业证号
    specialty VARCHAR(100), -- 专业科室
    title VARCHAR(50), -- 职称
    
    -- 患者专用字段
    birth_date DATE,
    gender VARCHAR(10),
    guardian_name VARCHAR(100), -- 监护人姓名
    guardian_phone VARCHAR(20), -- 监护人电话
    emergency_contact VARCHAR(100), -- 紧急联系人
    emergency_phone VARCHAR(20),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- 患者健康档案
CREATE TABLE patient_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- 基本健康信息
    height DECIMAL(5,2), -- 身高(cm)
    weight DECIMAL(5,2), -- 体重(kg)
    blood_type VARCHAR(10),
    allergies TEXT, -- 过敏史
    medical_history TEXT, -- 病史
    medications TEXT, -- 当前用药
    
    -- 口腔特殊信息
    dental_history TEXT, -- 牙科病史
    orthodontic_history TEXT, -- 正畸史
    habits TEXT, -- 不良习惯（如吮指、咬唇等）
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 检查项目模板
CREATE TABLE examination_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clinic_id UUID REFERENCES clinics(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    required_images JSON, -- 所需影像类型配置
    analysis_config JSON, -- AI分析配置
    report_template TEXT, -- 报告模板
    price DECIMAL(10,2), -- 检查价格
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 检查记录表
CREATE TABLE examinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES users(id),
    doctor_id UUID REFERENCES users(id),
    clinic_id UUID REFERENCES clinics(id),
    template_id UUID REFERENCES examination_templates(id),
    
    -- 检查基本信息
    examination_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    chief_complaint TEXT, -- 主诉
    present_illness TEXT, -- 现病史
    clinical_findings TEXT, -- 临床发现
    preliminary_diagnosis TEXT, -- 初步诊断
    
    -- 状态信息
    status report_status DEFAULT 'pending',
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 影像文件表
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    examination_id UUID REFERENCES examinations(id) ON DELETE CASCADE,
    
    -- 文件信息
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    
    -- 影像信息
    image_type analysis_type NOT NULL,
    capture_date TIMESTAMP WITH TIME ZONE,
    equipment_info JSON, -- 设备信息
    technical_params JSON, -- 技术参数
    
    -- 标注和预处理信息
    annotations JSON, -- 标注数据
    preprocessing_params JSON, -- 预处理参数
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI分析结果表
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    examination_id UUID REFERENCES examinations(id) ON DELETE CASCADE,
    image_id UUID REFERENCES images(id),
    
    -- 分析信息
    analysis_type analysis_type NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    confidence_score DECIMAL(5,4), -- 置信度分数
    processing_time_ms INTEGER, -- 处理时间（毫秒）
    
    -- 分析结果
    raw_results JSON NOT NULL, -- 原始分析结果
    structured_results JSON, -- 结构化结果
    key_findings JSON, -- 关键发现
    risk_assessment JSON, -- 风险评估
    recommendations JSON, -- 建议
    
    -- 质量控制
    quality_score DECIMAL(5,4), -- 质量分数
    quality_issues JSON, -- 质量问题
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 综合报告表
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    examination_id UUID REFERENCES examinations(id) ON DELETE CASCADE,
    
    -- 报告基本信息
    report_number VARCHAR(100) UNIQUE NOT NULL, -- 报告编号
    report_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- 报告内容
    executive_summary TEXT, -- 执行摘要
    detailed_findings TEXT, -- 详细发现
    ai_analysis_summary JSON, -- AI分析总结
    doctor_assessment TEXT, -- 医生评估
    recommendations TEXT, -- 治疗建议
    follow_up_plan TEXT, -- 随访计划
    
    -- 报告状态和审核
    status report_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    review_comments TEXT,
    
    -- 报告生成信息
    template_used VARCHAR(255),
    generated_by_ai BOOLEAN DEFAULT false,
    human_reviewed BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 报告附件表
CREATE TABLE report_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50), -- 'pdf', 'image', 'chart'
    file_size BIGINT,
    description TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 系统配置表
CREATE TABLE system_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSON NOT NULL,
    config_type VARCHAR(50) NOT NULL, -- 'ai_model', 'report_template', 'system_setting'
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 操作日志表
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSON,
    new_values JSON,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_users_clinic_id ON users(clinic_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_examinations_patient_id ON examinations(patient_id);
CREATE INDEX idx_examinations_doctor_id ON examinations(doctor_id);
CREATE INDEX idx_examinations_clinic_id ON examinations(clinic_id);
CREATE INDEX idx_examinations_date ON examinations(examination_date);
CREATE INDEX idx_examinations_status ON examinations(status);
CREATE INDEX idx_images_examination_id ON images(examination_id);
CREATE INDEX idx_images_type ON images(image_type);
CREATE INDEX idx_ai_analyses_examination_id ON ai_analyses(examination_id);
CREATE INDEX idx_ai_analyses_type ON ai_analyses(analysis_type);
CREATE INDEX idx_reports_examination_id ON reports(examination_id);
CREATE INDEX idx_reports_number ON reports(report_number);
CREATE INDEX idx_reports_date ON reports(report_date);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- 创建全文搜索索引
CREATE INDEX idx_users_full_name_gin ON users USING gin(full_name gin_trgm_ops);
CREATE INDEX idx_clinics_name_gin ON clinics USING gin(name gin_trgm_ops);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表添加更新时间触发器
CREATE TRIGGER update_clinics_updated_at BEFORE UPDATE ON clinics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patient_profiles_updated_at BEFORE UPDATE ON patient_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_examination_templates_updated_at BEFORE UPDATE ON examination_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_examinations_updated_at BEFORE UPDATE ON examinations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_images_updated_at BEFORE UPDATE ON images FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_analyses_updated_at BEFORE UPDATE ON ai_analyses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_configs_updated_at BEFORE UPDATE ON system_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入初始数据
INSERT INTO clinics (name, code, address, phone, contact_person, license_number) VALUES
('演示口腔诊所', 'DEMO001', '北京市朝阳区演示大街123号', '010-12345678', '张医生', 'LICENSE001'),
('儿童口腔专科', 'PEDO001', '上海市浦东新区儿童路456号', '021-87654321', '李主任', 'LICENSE002');

-- 插入系统管理员账号 (密码: admin123)
INSERT INTO users (username, email, password_hash, role, full_name, phone) VALUES
('admin', 'admin@ilm-rsp.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', '系统管理员', '13800000000');

-- 插入演示诊所的医生账号
INSERT INTO users (username, email, password_hash, role, clinic_id, full_name, phone, medical_license, specialty, title) 
SELECT 'doctor1', 'doctor1@demo.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'doctor', id, '张口腔医生', '13800000001', 'DOC001', '儿童口腔科', '主治医师'
FROM clinics WHERE code = 'DEMO001';

-- 插入基础检查模板
INSERT INTO examination_templates (clinic_id, name, description, required_images, price)
SELECT id, '儿童口腔常规检查', '包含口内照片、面相照片和全景片的基础检查', 
'{"required": ["intraoral", "facial", "panoramic"], "optional": ["cephalometric"]}', 
280.00
FROM clinics WHERE code = 'DEMO001';

-- 插入系统基础配置
INSERT INTO system_configs (config_key, config_value, config_type, description) VALUES
('ai_models', '{"intraoral": {"version": "v1.0", "enabled": true}, "facial": {"version": "v1.0", "enabled": true}}', 'ai_model', 'AI模型配置'),
('report_settings', '{"auto_generate": true, "require_review": true, "template": "standard"}', 'system_setting', '报告生成设置'),
('file_upload', '{"max_size": 50000000, "allowed_types": ["jpg", "jpeg", "png", "dcm", "tiff"]}', 'system_setting', '文件上传配置');

COMMIT;
