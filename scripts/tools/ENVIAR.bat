@echo off
chcp 65001 >nul
title VotaBrasil - Enviando correcoes...
color 0A
cd /d "%~dp0"

echo.
echo ====================================================
echo   VOTABRASIL - ENVIANDO CORRECOES PRO GITHUB
echo ====================================================
echo.
echo  Mudancas desta rodada:
echo    * Rebrand completo: VotaBrasil agora e VotaBrasil (nome, logo SVG, dominio)
echo    * Config global virou config.local.js (nunca versionar segredos)
echo    * SW votabrasil-v20 + namespace window.VotaBrasil
echo.
echo [1/3] Adicionando arquivos...
git add app/
git add config.local.js index.html
echo      OK
echo.
echo [2/3] Commitando...
git commit -m "fix: DiaD no fim da home + glossario na aba Votar + SW v14 anti-cache"
echo      OK
echo.
echo [3/3] Enviando para o GitHub...
git push origin master
echo.
echo ====================================================
echo   PRONTO!
echo.
echo   Abra no celular: https://VotaBrasil-redesign-production.up.railway.app/app/
echo   IMPORTANTE: feche o app completamente (recentes - arrasta pra cima)
echo   e abra 2 vezes para o novo SW substituir o antigo.
echo.
echo   Se ainda parecer velho:
echo     Android: Ajustes - Apps - Chrome - Armazenamento - Limpar dados
echo     iOS: Ajustes - Safari - Limpar Historico e Dados
echo ====================================================
echo.
pause
