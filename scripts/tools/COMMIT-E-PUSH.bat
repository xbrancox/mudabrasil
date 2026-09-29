@echo off
cd /d C:\Users\euler\votabrasil
git add -A
git commit -m "feat(conteudo): FAQ no site + pagina roadmap + scripts de manutencao"
git push origin main
echo.
echo Push concluido. O GitHub Pages republica em ~1 minuto.
pause
