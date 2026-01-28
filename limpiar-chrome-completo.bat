@echo off
echo ========================================
echo LIMPIEZA COMPLETA DE CHROME
echo ========================================
echo.
echo Cerrando Chrome...
taskkill /F /IM chrome.exe 2>nul
timeout /t 2 >nul

echo Limpiando cache de Chrome...
rd /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache" 2>nul
rd /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Code Cache" 2>nul
rd /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\GPUCache" 2>nul
rd /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Service Worker" 2>nul

echo Limpiando DNS...
ipconfig /flushdns >nul

echo.
echo ========================================
echo LIMPIEZA COMPLETADA
echo ========================================
echo.
echo Abriendo FinanGest en Chrome limpio...
timeout /t 2 >nul
start chrome.exe "https://finangest.vercel.app/app-v2.html"

echo.
echo Si sigue sin funcionar, el problema es Vercel.
echo Presiona cualquier tecla para salir...
pause >nul
