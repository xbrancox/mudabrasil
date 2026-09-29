@echo off
setlocal
title VotaBrasil - API Publica (v11) + LOG
cd /d "%~dp0"
set "LOG=%~dp0LOG-API-PUBLICA.txt"
echo Log: %LOG%
call :MAIN > "%LOG%" 2>&1
type "%LOG%"
echo.
pause
exit /b 0

:MAIN
echo [1/4] Verificando MudaBrasil\api-publica.js ...
if not exist "MudaBrasil\api-publica.js" (
  echo   [ERRO] api-publica.js nao encontrado!
  exit /b 1
)
echo   [OK] presente no disco

echo [2/4] Verificando MudaBrasil\api\dados.json ...
if not exist "MudaBrasil\api\dados.json" (
  echo   [ERRO] dados.json nao encontrado!
  exit /b 1
)
echo   [OK] presente no disco

echo [3/4] Patch MudaBrasil\index.html ...
powershell -NoProfile -Command "$p='MudaBrasil/index.html';$c=[IO.File]::ReadAllText($p);if($c.Contains('api-publica.js')){'JA-PATCHED'}else{$b=[char]60+'/body'+[char]62;$t='  '+[char]60+'script src='+[char]34+'api-publica.js'+[char]34+' defer'+[char]62+[char]60+'/script'+[char]62;$c=$c.Replace($b,$t+[char]10+$b);[IO.File]::WriteAllText($p,$c);'PATCH-OK'}"

echo [4/4] Commit e push ...
git add -A
git commit -m "feat: API publica para terceiros v11"
git push origin main

echo.
echo Concluido. Confira em ~2 min: https://xbrancox.github.io/mudabrasilv4/
exit /b 0
