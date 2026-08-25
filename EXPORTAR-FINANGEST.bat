@echo off
title Exportar FinanGest Completo
color 0A
echo.
echo ========================================
echo   EXPORTAR FINANGEST - APP COMPLETA
echo ========================================
echo.
echo Creando archivo ZIP con toda la app...
echo.

:: Crear carpeta de exportacion
if not exist "EXPORT-FINANGEST" mkdir EXPORT-FINANGEST

:: Copiar archivos principales
echo Copiando archivos...
xcopy /E /I /Y api EXPORT-FINANGEST\api
xcopy /E /I /Y public EXPORT-FINANGEST\public
copy package.json EXPORT-FINANGEST\
copy vercel.json EXPORT-FINANGEST\
copy .env.example EXPORT-FINANGEST\
copy README*.md EXPORT-FINANGEST\ 2>nul

:: Crear ZIP (requiere PowerShell)
echo.
echo Comprimiendo en ZIP...
powershell -command "Compress-Archive -Path 'EXPORT-FINANGEST\*' -DestinationPath 'FinanGest-App-Completa.zip' -Force"

echo.
echo ========================================
echo EXPORTACION COMPLETA!
echo ========================================
echo.
echo Archivo creado: FinanGest-App-Completa.zip
echo Ubicacion: %CD%\FinanGest-App-Completa.zip
echo.
echo Este ZIP contiene:
echo - Toda la app (frontend y backend)
echo - APIs y endpoints
echo - Configuracion de Vercel
echo - Documentacion
echo.
pause

:: Abrir carpeta
explorer /select,"FinanGest-App-Completa.zip"
