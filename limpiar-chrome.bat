@echo off
echo Cerrando Chrome...
taskkill /F /IM chrome.exe 2>nul
timeout /t 2 /nobreak >nul

echo Limpiando cache de Chrome...
rd /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache" 2>nul
rd /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Code Cache" 2>nul
rd /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Service Worker" 2>nul
rd /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\GPUCache" 2>nul

echo Cache limpiado!
echo.
echo Abriendo Chrome...
start chrome.exe https://finangest.vercel.app
