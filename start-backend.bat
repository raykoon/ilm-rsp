@echo off
echo.
echo 🚀 启动后端服务...
echo.

cd backend

echo 📦 检查依赖...
if not exist node_modules\express (
    echo 安装基础依赖...
    call npm install express cors
)

echo.
echo 🔧 启动简化服务器...
echo.
echo ✅ 服务地址: http://localhost:3001
echo 🔐 登录接口: http://localhost:3001/api/auth/login  
echo.
echo 🔑 测试账号:
echo    super@admin.com / admin123
echo    admin@clinic.com / admin123
echo    doctor@clinic.com / doctor123
echo.

node simple-server.js
