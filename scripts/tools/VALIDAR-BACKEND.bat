@echo off
chcp 65001 >nul
title MeuVoto — Validar Backend Railway
echo.
echo ========================================
echo  VALIDAR BACKEND RAILWAY
echo ========================================
echo.
echo Backend: ''
echo.
node scripts/validar-backend.js ''
if errorlevel 1 (
  echo.
  echo ❌ ALGUMA VALIDAÇÃO FALHOU
  pause
  exit /b 1
)
echo.
echo ========================================
echo  ✅ BACKEND 100%% FUNCIONAL
echo ========================================
pause
