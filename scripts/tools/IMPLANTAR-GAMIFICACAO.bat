@echo off
setlocal
title VotaBrasil - Gamificacao Civica (v10) + LOG
cd /d "%~dp0"
set "LOG=%~dp0LOG-GAMIFICACAO.txt"
call :MAIN > "%LOG%" 2>&1
type "%LOG%"
echo.
pause
exit /b 0

:MAIN
echo [1/3] Verificando MudaBrasil\gamificacao.js ...
if exist "MudaBrasil\gamificacao.js" (
echo   [OK] presente no disco
) else (
echo   [FALHOU] gamificacao.js ausente - avise o assistente
exit /b 1
)
echo [2/3] Patch MudaBrasil\index.html ...
powershell -NoProfile -Command "$p='MudaBrasil/index.html';$c=[IO.File]::ReadAllText($p);if($c.Contains('gamificacao.js')){'JA-PATCHED'}else{$b=[char]60+'/body'+[char]62;$t='  '+[char]60+'script src='+[char]34+'gamificacao.js'+[char]34+' defer'+[char]62+[char]60+'/script'+[char]62;$c=$c.Replace($b,$t+[char]10+$b);[IO.File]::WriteAllText($p,$c);'PATCH-OK'}"
findstr /c:"gamificacao.js" "MudaBrasil\index.html" >nul && echo   tag confirmada no index.html || echo   [AVISO] tag nao encontrada no index.html
echo [3/3] Commit e push ...
git add -A
git commit -m "feat: gamificacao civica v10"
git push origin main
echo Concluido. Confira em ~2 min: https://xbrancox.github.io/mudabrasilv4/
exit /b 0
