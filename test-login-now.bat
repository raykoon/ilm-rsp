@echo off
echo.
echo 🔍 完整登录功能诊断测试
echo ===============================
echo.

echo 1. 检查后端服务状态...
curl -s -o nul -w "HTTP状态码: %%{http_code}" http://localhost:3001/health
if %errorlevel% == 0 (
    echo ✅ 后端服务正常
) else (
    echo ❌ 后端服务连接失败
    echo 请确保后端服务正在运行！
    pause
    exit /b 1
)

echo.
echo.

echo 2. 测试登录接口...
curl -X POST -H "Content-Type: application/json" -d "{\"email\":\"super@admin.com\",\"password\":\"admin123\"}" http://localhost:3001/api/auth/login
echo.

echo.
echo.

echo 3. 检查前端服务状态...
curl -s -o nul -w "HTTP状态码: %%{http_code}" http://localhost:3000
if %errorlevel% == 0 (
    echo ✅ 前端服务正常
) else (
    echo ❌ 前端服务未启动
    echo 正在启动前端服务...
    start cmd /k "cd frontend && npm run dev"
    echo 请等待前端服务启动完成
)

echo.
echo.

echo 4. 测试前端API代理...
curl -s -o nul -w "HTTP状态码: %%{http_code}" http://localhost:3000/api/health
echo.

echo.
echo ===============================
echo 🎯 诊断结果：
echo.
echo ✅ 如果所有HTTP状态码都是200，说明服务正常
echo ❌ 如果有非200状态码，说明对应服务有问题
echo.
echo 🚀 下一步：
echo   1. 在浏览器打开: http://localhost:3000/login
echo   2. 使用账号: super@admin.com / admin123
echo   3. 如果还有问题，请查看浏览器F12控制台错误
echo.
pause
