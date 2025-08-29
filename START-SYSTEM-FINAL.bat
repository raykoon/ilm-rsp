@echo off
title 儿童口腔AI筛查平台 - 系统启动
color 0A

echo ====================================
echo 🚀 儿童口腔AI筛查平台 - 完整启动
echo ====================================
echo.

echo 🧹 清理旧进程...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo ✅ 清理完成
echo.

echo 🔥 启动后端服务 (端口:3001)...
start "后端服务" /min cmd /c "cd /d %~dp0 && node backend-enhanced.js"

echo ⏳ 等待后端启动...
timeout /t 8 /nobreak >nul

echo 🔍 检查后端状态...
curl -s http://localhost:3001/health >nul
if %errorlevel% neq 0 (
    echo ❌ 后端启动失败！
    pause
    exit /b 1
)
echo ✅ 后端服务启动成功！

echo.
echo 🎨 启动前端服务 (端口:3000)...
start "前端服务" cmd /c "cd /d %~dp0frontend && set PORT=3000 && npm run dev"

echo ⏳ 等待前端编译...
timeout /t 15 /nobreak >nul

echo.
echo 🎉 ====================================
echo ✅ 系统启动完成！
echo ====================================
echo 📱 前端地址: http://localhost:3000
echo 🔧 后端API: http://localhost:3001
echo 🔑 测试账号: super@admin.com / admin123
echo ====================================
echo.
echo 💡 现在可以在浏览器中访问前端地址进行测试！
echo 💡 如有问题，请检查两个新打开的窗口中的错误信息
echo.

pause
