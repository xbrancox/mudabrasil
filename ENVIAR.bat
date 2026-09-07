@echo off
chcp 65001 >nul
title MudaBrasil - Enviando alteracoes...
color 0A
cd /d "%~dp0"

echo.
echo ====================================================
echo   MUDABRASIL - ENVIANDO CORRECOES PRO GITHUB
echo ====================================================
echo.
echo [1/3] Adicionando arquivos...
git add -A
echo      OK
echo.
echo [2/3] Commitando...
git commit -m "fix: header unificado em todas as paginas (js/header-unificado.js)"
echo      OK
echo.
echo [3/3] Enviando para o GitHub (Railway/ Pages atualiza sozinho em ~1-2 min)...
git push origin master
echo.
echo ====================================================
echo   PRONTO! Abra https://xbrancox.github.io/mudabrasil/
echo   e navegue pelas paginas com Ctrl+Shift+R (hard refresh).
echo ====================================================
echo.
pause
