@echo off
echo.
echo ========================================
echo   ACTUALIZANDO VECTORA MARKETING
echo   Proyecto: vectora-marketing
echo ========================================
echo.

cd anuncios-ia

echo Subiendo diseño profesional v2.0...
echo.

git add .
git commit -m "Diseño profesional v2.0 - Gradientes púrpura y efectos premium"
git push

echo.
echo ========================================
echo   ✅ ACTUALIZACIÓN EN PROCESO!
echo ========================================
echo.
echo Vercel detectará el push y actualizará automáticamente
echo Espera 1-2 minutos y abre:
echo.
echo 🔗 https://vectora-marketing.vercel.app/ultra.html
echo.
echo (Si no funciona, prueba con tu dominio personalizado)
echo.
pause
