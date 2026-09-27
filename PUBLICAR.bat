@echo off
cd /d C:\Users\euler\votabrasil
echo ============================================
echo  PUBLICAR VotaBrasil - persiste correcoes
echo ============================================
echo.
echo == Arquivos alterados no disco ==
git status --short
echo.
git add -A
git commit -m "fix(config): backend volta para -79eb vivo (votabrasil.up.railway.app dava 404); sincroniza home (manifesto, FAQ, pacote visual)"
git push origin main
echo.
echo == Ultimos 3 commits ==
git log --oneline -3
echo.
echo Publicando... o GitHub Pages atualiza em ~1-2 min.
echo Confira em: https://xbrancox.github.io/votabrasil/
pause
