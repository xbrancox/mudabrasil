@echo off
cd /d "C:\Users\euler\votabrasil"
echo Publicando HEAD no repo xbrancox/mudabrasil (main)...
git push site HEAD:main
echo.
echo Se apareceu 'main -> main' ou um hash, deu certo. O Pages atualiza em ~1-2 min.
pause