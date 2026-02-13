@echo off
echo ========================================
echo   VECTORA MARKETING - INICIANDO...
echo ========================================
echo.

cd anuncios-ia

echo Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias por primera vez...
    call npm install
)

echo.
echo Iniciando servidor...
echo.
echo ========================================
echo   VECTORA MARKETING LISTO!
echo ========================================
echo.
echo Abre tu navegador en:
echo http://localhost:3001/ultra.html
echo.
echo Presiona Ctrl+C para detener el servidor
echo ========================================
echo.

call npm start
