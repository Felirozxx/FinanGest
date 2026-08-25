@echo off
echo.
echo ========================================
echo   INICIANDO SERVIDOR FINANGEST
echo ========================================
echo.
echo Iniciando servidor de desarrollo...
echo.
echo IMPORTANTE: 
echo - NO cierres esta ventana mientras uses FinanGest
echo - La app estara disponible en http://localhost:3000
echo - Presiona Ctrl+C para detener el servidor
echo.
echo ========================================
echo.

REM Iniciar el servidor
vercel dev
