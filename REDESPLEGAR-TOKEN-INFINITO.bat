@echo off
echo ========================================
echo   REDESPLEGAR CON TOKEN INFINITO
echo ========================================
echo.
echo Desplegando desde la carpeta correcta...
echo.

cd /d "%~dp0\anuncios-ia"
vercel --prod

echo.
echo ========================================
echo   LISTO! Token infinito activado
echo ========================================
echo.
echo Tu app renovara el token automaticamente
echo cada dia. Funcionara PARA SIEMPRE.
echo.
pause
