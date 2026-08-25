@echo off
title Arreglar MongoDB Atlas - FinanGest
color 0A
echo.
echo ========================================
echo   ARREGLAR MONGODB ATLAS - FINANGEST
echo ========================================
echo.
echo Este script abrira MongoDB Atlas para configurar tu IP.
echo.
echo PASOS AUTOMATICOS:
echo 1. Abriendo MongoDB Atlas...
start https://cloud.mongodb.com/v2/675e26ec4e3ded4fa2655af6#/security/network/accessList
echo.
echo 2. Cuando se abra la pagina:
echo    - Click en "ADD IP ADDRESS" (boton verde)
echo    - Selecciona "ALLOW ACCESS FROM ANYWHERE"
echo    - Se llenara: 0.0.0.0/0
echo    - Click "Confirm"
echo.
echo 3. ESPERA 2 MINUTOS para que MongoDB aplique los cambios
echo.
pause
echo.
echo ========================================
echo Esperando 2 minutos...
echo ========================================
timeout /t 120 /nobreak
echo.
echo ========================================
echo PROBANDO CONEXION A MONGODB...
echo ========================================
node fix-mongodb-connection.js
echo.
echo ========================================
if errorlevel 1 (
    echo FALLO! MongoDB aun no responde.
    echo.
    echo SOLUCIONES:
    echo 1. Espera 2 minutos mas
    echo 2. Usa el login de emergencia:
    echo    https://finangest.vercel.app/login-emergency.html
    echo    Email: admin@finangest.com
    echo    Password: admin123
) else (
    echo EXITO! MongoDB conectado correctamente.
    echo Ahora puedes usar: https://finangest.vercel.app
)
echo ========================================
pause
