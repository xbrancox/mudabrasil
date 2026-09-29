@echo off
chcp 65001 >nul
title MeuVoto — Bateria de Testes
color 0A
cd /d "%~dp0"

echo.
echo ========================================
echo  MEUVOTO - BATERIA COMPLETA DE TESTES
echo ========================================
echo.
echo Node.js:
node --version
echo.

echo [1/4] test-engine.js (25 checks - motor do backend)...
echo.
node tests/test-engine.js
if errorlevel 1 goto :fail
echo.

echo [2/4] test-thermometer.js (21 checks - ciclo votar/ver/revogar)...
echo.
node tests/test-thermometer.js
if errorlevel 1 goto :fail
echo.

echo [3/4] test-live.js (4 checks - SSE tempo real)...
echo.
node tests/test-live.js
if errorlevel 1 goto :fail
echo.

echo [4/4] test-render.js (6 checks - renderização das páginas)...
echo.
node tests/test-render.js
if errorlevel 1 goto :fail
echo.

echo.
echo ========================================
echo  ✅ TODOS OS TESTES PASSARAM
echo ========================================
echo.
echo Se tudo estiver OK, duplo-clique em ENVIAR.bat
echo para fazer push ao GitHub.
echo.
pause
exit /b 0

:fail
echo.
echo ========================================
echo  ❌ ALGUM TESTE FALHOU
echo ========================================
echo.
pause
exit /b 1
