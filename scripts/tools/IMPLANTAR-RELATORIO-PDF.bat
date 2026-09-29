@echo off
setlocal
title VotaBrasil - Implante PDF (v6) + LOG
cd /d "%~dp0"
set "LOG=%~dp0LOG-IMPLANTACAO.txt"
echo Log: %LOG%
call :MAIN > "%LOG%" 2>&1
type "%LOG%"
echo.
pause
exit /b 0

:MAIN
echo [1/4] Gravando MudaBrasil\pdf-cassacao.js ...
echo /* vb-pdf-v6 */ > "MudaBrasil\pdf-cassacao.js"
echo (function(){ >> "MudaBrasil\pdf-cassacao.js"
echo var T=70; >> "MudaBrasil\pdf-cassacao.js"
echo function cards(){return [].slice.call(document.querySelectorAll('.card,[data-revogado]'));} >> "MudaBrasil\pdf-cassacao.js"
echo function pct(c){var d=c.getAttribute('data-revogado');if(d){return +d;}var m=(c.textContent^|^|'').match(/([0-9]{1,3})\s*%%/);return m?+m[1]:0;} >> "MudaBrasil\pdf-cassacao.js"
echo function nome(c){var e=c.querySelector('h3,h4,strong');return e?e.textContent.trim():'Politico';} >> "MudaBrasil\pdf-cassacao.js"
echo function btn(c){if(c.getAttribute('data-vbpdf')){return;}c.setAttribute('data-vbpdf','1');var b=document.createElement('button');b.textContent='Gerar Relatorio de Cassacao (PDF)';b.style.cssText='display:block;margin:8px 0;padding:10px 14px;background:#C0392B;color:#fff;border:0;border-radius:8px;font-weight:700;cursor:pointer';b.onclick=function(){relatorio([c]);};c.appendChild(b);} >> "MudaBrasil\pdf-cassacao.js"
echo function relatorio(cs){var w=window.open('','_blank');if(!w){alert('Permita pop-ups');return;}var r='';for(var i=0;i^<cs.length;i++){var c=cs[i];r=r+'^<tr^>^<td^>'+nome(c)+'^</td^>^<td^>'+pct(c)+'%%^</td^>^</tr^>';}w.document.write('^<html^>^<head^>^<meta charset=utf-8^>^<title^>Relatorio VotaBrasil^</title^>^</head^>^<body onload=window.print()^>^<h1^>VotaBrasil - Relatorio de Cassacao^</h1^>^<p^>Regra: 70%% = cassacao. Prototipo demonstrativo.^</p^>^<table border=1 cellpadding=8^>^<tr^>^<th^>Politico^</th^>^<th^>Revogacao^</th^>^</tr^>'+r+'^</table^>^<p^>'+new Date().toLocaleString('pt-BR')+'^</p^>^<p^>Assinatura: ______________________^</p^>^</body^>^</html^>');w.document.close();} >> "MudaBrasil\pdf-cassacao.js"
echo function scan(){cards().forEach(function(c){if(pct(c)^>=T){btn(c);}});} >> "MudaBrasil\pdf-cassacao.js"
echo var n=0;var t=setInterval(function(){scan();n++;if(n^>40){clearInterval(t);}},1500); >> "MudaBrasil\pdf-cassacao.js"
echo scan(); >> "MudaBrasil\pdf-cassacao.js"
echo })(); >> "MudaBrasil\pdf-cassacao.js"
echo [OK] pdf-cassacao.js gravado

echo [2/4] Inserindo tag script no MudaBrasil\index.html ...
powershell -NoProfile -Command "$p='MudaBrasil/index.html';$c=[IO.File]::ReadAllText($p);if($c.Contains('pdf-cassacao.js')){'JA-PATCHED'}else{$b=[char]60+'/body'+[char]62;$t='  '+[char]60+'script src='+[char]34+'pdf-cassacao.js'+[char]34+' defer'+[char]62+[char]60+'/script'+[char]62;$c=$c.Replace($b,$t+[char]10+$b);[IO.File]::WriteAllText($p,$c);'PATCH-OK'}"

echo [3/4] Commit e push ...
git add -A
git commit -m "feat: relatorio PDF de cassacao v6"
git push origin main

echo [4/4] Concluido.
echo Confira em ~2 min: https://xbrancox.github.io/mudabrasilv4/
exit /b 0