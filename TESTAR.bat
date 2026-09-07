@echo off
chcp 65001 >nul
title MudaBrasil - Verificando site...
color 0A
cd /d "%~dp0"

echo.
echo ====================================================
echo   MUDABRASIL - TESTE AUTOMATICO
echo ====================================================
echo.
echo Verificando arquivos locais...
echo.

set /a ok=0
set /a fail=0

if exist "js\header-unificado.js" (
    echo [OK] js/header-unificado.js
    set /a ok+=1
) else (
    echo [ERRO] js/header-unificado.js nao encontrado
    set /a fail+=1
)

if exist "pages\congresso.html" (
    echo [OK] pages/congresso.html
    set /a ok+=1
) else (
    echo [ERRO] pages/congresso.html nao encontrado
    set /a fail+=1
)

for %%f in (pages\candidatos.html pages\comunidade.html pages\congresso.html pages\eleicoes-2026.html pages\meu-voto.html pages\parlamentares.html pages\proposta.html pages\revogar.html pages\status.html pages\termometro.html pages\votacoes.html) do (
    findstr /C:"header-unificado.js" "%%f" >nul 2>&1
    if !errorlevel! == 0 (
        echo [OK] %%~nxf - tem script do header unificado
        set /a ok+=1
    ) else (
        echo [ERRO] %%~nxf - FALTA script do header unificado
        set /a fail+=1
    )
)

echo.
echo ====================================================
echo   RESULTADO: %ok% OK / %fail% ERRO
echo ====================================================
echo.
echo Se tudo estiver OK, duplo-clique em ENVIAR.bat
echo para fazer push ao GitHub.
echo.
pause
