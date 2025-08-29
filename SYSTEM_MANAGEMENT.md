# 🏥 儿童口腔AI筛查平台 - 系统管理指南

## 📊 **当前系统状态**

✅ **前端服务**: http://localhost:3000 (正常运行)  
✅ **后端服务**: http://localhost:3001 (正常运行)  
✅ **所有组件**: 完整无缺失  
✅ **全屏UI**: 已全面应用  

---

## 🚀 **快速管理脚本**

### 1. **检查系统状态**
```powershell
.\check-system-status.ps1
```
**功能**:
- 检查前后端服务运行状态
- 验证端口占用情况
- 健康检查测试
- 显示访问信息和测试账号

### 2. **启动系统**
```powershell
.\start-system.ps1
```
**功能**:
- 自动启动后端和前端服务
- 检查端口冲突
- 等待服务就绪
- 显示启动状态

### 3. **停止系统**
```powershell
.\stop-system.ps1
```
**功能**:
- 优雅停止所有Node.js服务
- 释放端口占用
- 清理临时文件
- 确认停止状态

---

## 🔑 **测试账号**

| 角色 | 邮箱 | 密码 | 权限 |
|------|------|------|------|
| 超级管理员 | super@admin.com | admin123 | 全部功能 |
| 门诊管理员 | admin@clinic.com | admin123 | 门诊管理 |
| 医生 | doctor@clinic.com | doctor123 | 患者检查 |
| 患者 | patient@example.com | patient123 | 个人查看 |

---

## 🌐 **访问地址**

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:3001
- **健康检查**: http://localhost:3001/health
- **API文档**: http://localhost:3001/api (如需要)

---

## 🎯 **核心功能页面**

### 管理员功能
- **仪表盘**: http://localhost:3000/admin
- **用户管理**: http://localhost:3000/admin/users
- **门诊管理**: http://localhost:3000/admin/clinics
- **患者管理**: http://localhost:3000/admin/patients
- **检查记录**: http://localhost:3000/admin/examinations
- **系统设置**: http://localhost:3000/admin/settings

### 门诊功能
- **工作台**: http://localhost:3000/clinic
- **患者管理**: http://localhost:3000/clinic/patients
- **新建检查**: http://localhost:3000/clinic/examination/new ⭐⭐⭐⭐⭐
- **检查记录**: http://localhost:3000/clinic/examinations
- **报告中心**: http://localhost:3000/clinic/reports

### 患者功能
- **个人中心**: http://localhost:3000/patient
- **检查记录**: http://localhost:3000/patient/examinations
- **健康报告**: http://localhost:3000/patient/reports

---

## 🛠️ **手动操作命令**

### 启动服务
```powershell
# 启动后端
node backend-enhanced.js

# 启动前端 (新终端)
cd frontend
npm run dev
```

### 停止服务
```powershell
# 停止所有Node.js进程
taskkill /f /im node.exe

# 或查看具体进程
netstat -ano | findstr ":300"
taskkill /f /pid [进程ID]
```

### 检查状态
```powershell
# 检查端口占用
netstat -ano | findstr ":3000"
netstat -ano | findstr ":3001"

# 检查Node.js进程
tasklist /fi "imagename eq node.exe"

# 测试后端健康
curl http://localhost:3001/health

# 测试前端
curl http://localhost:3000
```

---

## 🔧 **故障排除**

### 常见问题

#### 1. **端口占用错误**
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3000
```
**解决方案**:
```powershell
# 查找占用进程
netstat -ano | findstr ":3000"
# 结束进程
taskkill /f /pid [进程ID]
```

#### 2. **权限错误**
```
Error: EPERM: operation not permitted
```
**解决方案**:
```powershell
# 以管理员身份运行PowerShell
# 或清理node_modules重新安装
cd frontend
Remove-Item node_modules -Recurse -Force
npm install
```

#### 3. **前端编译错误**
**解决方案**:
```powershell
cd frontend
npm run build  # 检查编译
npm run dev    # 重新启动
```

#### 4. **后端连接失败**
**解决方案**:
```powershell
# 检查backend-enhanced.js是否存在
# 检查依赖是否安装
node --version
npm --version
```

---

## 🎨 **界面特色**

### 全屏现代化设计
- **FullScreenLayout**: 所有主页面统一布局
- **渐变效果**: `bg-gradient-to-br` 专业配色
- **响应式设计**: 完美适配各种屏幕
- **动画效果**: Framer Motion流畅过渡

### 医疗专业风格
- **统计卡片**: 直观的数据展示
- **状态徽章**: 清晰的状态标识
- **专业配色**: 蓝色、绿色、紫色医疗主题

---

## 📊 **系统监控**

### 性能监控
- **内存使用**: 通过脚本查看进程内存占用
- **响应时间**: 健康检查API响应速度
- **端口状态**: 实时监控服务可用性

### 日志查看
- **后端日志**: 控制台实时显示API请求
- **前端日志**: 浏览器开发者工具Console
- **系统日志**: PowerShell脚本运行日志

---

## 🚨 **紧急操作**

### 强制重启系统
```powershell
# 1. 强制停止所有服务
taskkill /f /im node.exe

# 2. 等待2秒
Start-Sleep 2

# 3. 重新启动
.\start-system.ps1
```

### 完全重置
```powershell
# 1. 停止服务
.\stop-system.ps1

# 2. 清理缓存
cd frontend
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item node_modules\.cache -Recurse -Force -ErrorAction SilentlyContinue

# 3. 重新启动
cd ..
.\start-system.ps1
```

---

## 📞 **技术支持**

### 系统要求
- **Node.js**: v18+ 
- **NPM**: v8+
- **操作系统**: Windows 10+
- **浏览器**: Chrome, Edge, Firefox

### 联系信息
- **项目文档**: 查看项目根目录的README文件
- **技术问题**: 检查控制台错误信息
- **功能反馈**: 记录具体的使用场景和问题

---

## 🎉 **系统已完全就绪！**

🚀 **前端和后端服务正常运行**  
🎨 **现代化全屏UI设计完美呈现**  
🏥 **专业医疗界面体验优秀**  
✨ **16个功能页面全部完成**  

**现在您可以开始使用完整的儿童口腔AI筛查平台了！**
