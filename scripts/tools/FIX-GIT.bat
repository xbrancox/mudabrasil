@echo off
title VotaBrasil - Fix Git Automatico
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     VotaBrasil - Correcao Automatica Git                   ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo Executando script automatico...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0FIX-GIT.ps1"
echo.
echo Script concluido!
timeout /t 5
