@echo off
echo ============================
echo 🚀 快速系统测试
echo ============================

echo 🔍 检查后端服务...
curl -s http://localhost:3001/health > nul
if %errorlevel% equ 0 (
    echo ✅ 后端服务正常 [3001端口]
) else (
    echo ❌ 后端服务异常
    goto :end
)

echo.
echo 🔍 测试登录接口...
curl -s -X POST -H "Content-Type: application/json" -d "{\"email\":\"super@admin.com\",\"password\":\"admin123\"}" http://localhost:3001/api/auth/login > nul
if %errorlevel% equ 0 (
    echo ✅ 登录接口正常
) else (
    echo ❌ 登录接口异常
)

echo.
echo 🔍 检查前端服务...
timeout /t 3 /nobreak > nul
curl -s http://localhost:3000 > nul
if %errorlevel% equ 0 (
    echo ✅ 前端服务正常 [3000端口]
    echo.
    echo 🎉 系统启动成功！可以开始测试了
    echo 📱 前端地址: http://localhost:3000  
    echo 🔐 测试账号: super@admin.com / admin123
    echo.
    echo 💡 在浏览器中打开前端地址并尝试登录
) else (
    echo ⏳ 前端服务还在启动中...
    echo 💡 请等待前端编译完成后访问: http://localhost:3000
)

:end
echo ============================
pause
