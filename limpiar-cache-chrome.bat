@echo off
echo Cerrando Chrome...
taskkill /F /IM chrome.exe 2>nul
timeout /t 2 /nobreak >nul

echo Borrando cache de Chrome...
del /q /s "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Cache\*.*" 2>nul
del /q /s "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Code Cache\*.*" 2>nul
rmdir /s /q "%LOCALAPPDATA%\Google\Chrome\User Data\Default\Service Worker" 2>nul

echo Cache borrado!
echo.
echo Abriendo FinanGest...
start chrome.exe "https://finangest.vercel.app/app.html"
