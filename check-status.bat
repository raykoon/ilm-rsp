@echo off
echo.
echo ====================================
echo 儿童口腔AI筛查平台 - 系统状态检查
echo ====================================
echo.

echo 检查后端服务 (3001端口)...
curl -s http://localhost:3001/health >nul 2>&1
if %errorlevel%==0 (
    echo ✓ 后端服务正常运行
) else (
    echo ✗ 后端服务异常
)

echo.
echo 检查前端服务 (3000端口)...
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel%==0 (
    echo ✓ 前端服务正常运行
) else (
    echo ✗ 前端服务异常
)

echo.
echo 检查Node.js进程...
tasklist /fi "imagename eq node.exe" | findstr node >nul 2>&1
if %errorlevel%==0 (
    echo ✓ Node.js进程运行中
    tasklist /fi "imagename eq node.exe"
) else (
    echo ✗ 未发现Node.js进程
)

echo.
echo 端口占用情况:
netstat -ano | findstr ":300"

echo.
echo ====================================
echo 访问地址:
echo   前端: http://localhost:3000
echo   后端: http://localhost:3001
echo.
echo 测试账号:
echo   管理员: super@admin.com / admin123
echo   医生: doctor@clinic.com / doctor123
echo ====================================
echo.
pause
