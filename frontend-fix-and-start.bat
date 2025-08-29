@echo off
echo.
echo 🔧 修复并启动前端服务...
echo.

cd frontend

echo 📦 清理和重新安装依赖...
if exist node_modules (
    echo 🗑️ 删除旧的node_modules...
    rmdir /s /q node_modules
)

if exist .next (
    echo 🗑️ 删除Next.js缓存...
    rmdir /s /q .next
)

if exist package-lock.json (
    echo 🗑️ 删除package-lock.json...
    del package-lock.json
)

echo 🧹 清理npm缓存...
npm cache clean --force

echo 📦 重新安装依赖...
npm install

echo.
echo 🔍 检查项目结构...
if exist "src\app\layout.tsx" (
    echo ✅ App Router配置正常
) else (
    echo ❌ 缺少App Router layout文件
)

if exist "src\pages\_app.tsx" (
    echo ⚠️ 发现冲突的Pages Router配置，已删除
    del "src\pages\_app.tsx"
) else (
    echo ✅ 无Pages Router冲突
)

echo.
echo 🎨 启动前端开发服务器...
echo.
echo ✅ 前端地址: http://localhost:3000
echo 🔗 后端API: http://localhost:3001  
echo 📋 登录页面: http://localhost:3000/login
echo.
echo 🔑 测试账号:
echo    super@admin.com / admin123 （超级管理员）
echo.
echo 🔥 注意: 增强版后端正在运行，包含真实业务API!
echo.

npm run dev
