@echo off
echo.
echo 🎨 启动前端服务（最终版）...
echo.

cd frontend

echo 📦 检查前端依赖...
if not exist node_modules (
    echo 安装前端依赖...
    call npm install
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
echo    admin@clinic.com / admin123 （门诊管理员）
echo    doctor@clinic.com / doctor123 （医生）
echo.
echo 🔥 注意: 增强版后端已启动，包含真实业务API!
echo.

npm run dev
