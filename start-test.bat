@echo off
echo 🚀 Iniciando prueba de múltiples instancias...

echo.
echo 📦 Iniciando instancia 1 (puerto 3001)...
start "Instance 1" cmd /k "set INSTANCE_ID=test-vps-1 && set PORT=3001 && node test-multiple-instances.js"

timeout /t 2 /nobreak >nul

echo 📦 Iniciando instancia 2 (puerto 3002)...
start "Instance 2" cmd /k "set INSTANCE_ID=test-vps-2 && set PORT=3002 && node test-multiple-instances.js"

timeout /t 2 /nobreak >nul

echo 📦 Iniciando instancia 3 (puerto 3003)...
start "Instance 3" cmd /k "set INSTANCE_ID=test-vps-3 && set PORT=3003 && node test-multiple-instances.js"

timeout /t 5 /nobreak >nul

echo 📦 Iniciando Load Balancer (puerto 3000)...
start "Load Balancer" cmd /k "node test-load-balancer.js"

echo.
echo ✅ Todas las instancias iniciadas
echo.
echo 🧪 Para probar:
echo    curl http://localhost:3000/click204
echo    curl http://localhost:3000/status
echo.
echo 📊 Para ver logs, revisa las ventanas de consola
echo.
pause
