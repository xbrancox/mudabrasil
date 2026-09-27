@echo off
chcp 65001 >nul 2>&1
title VotaBrasil - Configurar Dominio
cd /d "C:\Users\euler\votabrasil"
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\CONFIGURAR-DOMINIO.ps1"
pause
