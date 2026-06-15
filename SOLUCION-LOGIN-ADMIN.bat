@echo off
echo ========================================
echo   SOLUCION: LOGIN ADMIN NO FUNCIONA
echo ========================================
echo.
echo PASO 1: Configurar MongoDB Atlas
echo --------------------------------
echo 1. Abre: https://cloud.mongodb.com/
echo 2. Inicia sesion con tu cuenta MongoDB
echo 3. Ve a "Network Access" (menu izquierdo)
echo 4. Click "ADD IP ADDRESS"
echo 5. Selecciona "ALLOW ACCESS FROM ANYWHERE"
echo 6. Click "Confirm"
echo 7. ESPERA 2-3 MINUTOS
echo.
pause
echo.
echo PASO 2: Presiona una tecla para abrir MongoDB Atlas...
pause
start https://cloud.mongodb.com/v2#/security/network/accessList
echo.
echo Esperando que configures MongoDB Atlas...
echo Cuando termines, presiona una tecla para continuar...
pause
echo.
echo PASO 3: Verificando conexion a MongoDB...
node check-admin-users.js
echo.
echo ========================================
echo Si sale "User found", el problema esta resuelto!
echo ========================================
pause
