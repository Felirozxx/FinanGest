@echo off
echo.
echo ========================================
echo   INICIANDO FINANGEST
echo ========================================
echo.
echo Tu app esta completa y funcionando!
echo.
echo Iniciando servidor en http://localhost:3000
echo.
echo IMPORTANTE:
echo - NO cierres esta ventana
echo - El navegador se abrira automaticamente
echo - Espera 10 segundos a que cargue todo
echo.
echo ========================================
echo.

REM Iniciar servidor en segundo plano y abrir navegador
start /B vercel dev

REM Esperar 10 segundos
timeout /t 10 /nobreak

REM Abrir en Chrome
start chrome http://localhost:3000

echo.
echo Listo! FinanGest esta corriendo
echo.
echo Presiona Ctrl+C para detener el servidor
echo.
pause
