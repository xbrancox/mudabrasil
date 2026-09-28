@echo off
chcp 65001 >nul
title MeuVoto — Validar Backend Railway
echo.
echo ========================================
echo  VALIDAR BACKEND RAILWAY
echo ========================================
echo.
echo Backend: https://mudabrasil-production-79eb.up.railway.app
echo.
node scripts/validar-backend.js https://mudabrasil-production-79eb.up.railway.app
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
