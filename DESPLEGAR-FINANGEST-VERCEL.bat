@echo off
echo.
echo ========================================
echo   DESPLEGANDO FINANGEST EN VERCEL
echo ========================================
echo.
echo Esto subirá FinanGest a internet como Vectora Marketing
echo.
echo IMPORTANTE:
echo - Necesitas tener configuradas las variables de entorno en Vercel
echo - MongoDB URI, JWT_SECRET, etc.
echo.
echo ========================================
echo.
echo Iniciando despliegue...
echo.

vercel --prod

echo.
echo Listo! FinanGest está ahora en línea
echo.
echo Presiona cualquier tecla para cerrar...
pause >nul
