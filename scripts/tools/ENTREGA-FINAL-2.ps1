cd C:\Users\euler\MudaBrasil
[Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12
# 1) logo VB garantida no disco
@'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="110" fill="#2ECC71"/><text x="256" y="345" font-family="Arial Black,Arial,sans-serif" font-size="200" font-weight="900" fill="#061a3a" text-anchor="middle">VB</text></svg>
'@|Set-Content app\logo.svg -Encoding UTF8
$j=Get-Content app\app.js -Raw
# 2) headerHTML reescrito (1 logo so, com fallback)
$s=$j.IndexOf('function headerHTML(')
if($s -ge 0){$e=$j.IndexOf('}',$s)+1
$novo='function headerHTML(t,back){return ''<header><button class="hback" ''+(back?''data-back="1"'':''style="visibility:hidden"'')+''>\u2190</button><img class="logo" src="logo.svg" alt="" onerror="this.remove()"><b>''+esc(t===''MudaBrasil''?''VotaBrasil'':t)+''</b><button class="hback" id="fontbtn" data-acao="fonte" title="Fonte grande">A+</button><span class="badge" id="badge">\u2026</span></header>''}'
$j=$j.Remove($s,$e-$s).Insert($s,$novo);Write-Host 'header reescrito' -ForegroundColor Green}else{Write-Host 'ERRO: headerHTML nao achou' -ForegroundColor Red}
# 3) nav Apuracoes -> Apuracoes com acento (codepoint, a prova de Notepad ANSI)
$acc='Apura'+[char]0x00E7+[char]0x00F5+'es'
$j=$j.Replace("'Apuracoes'","'"+$acc+"'")
Set-Content app\app.js $j -Encoding UTF8
# 4) css: grade 2x2 no celular + cards compactos
$c=Get-Content app\app.css -Raw
$c=$c.Replace('.grid2{grid-template-columns:1fr}','.grid2{grid-template-columns:1fr 1fr}')
if(-not $c.Contains('VB-OVERRIDE2')){Add-Content app\app.css @"

/* VB-OVERRIDE2 */
.grid2{gap:8px}
.card{padding:12px}
.card.c-row .c-ico{font-size:18px}
.card b{font-size:14px}
.card small{font-size:11px}
.card .btn-gold{padding:9px 14px;font-size:11px}
header .logo{width:30px;height:30px;border-radius:8px}
"@ -Encoding UTF8;Write-Host 'css 2x2 compacto' -ForegroundColor Green}
Set-Content app\app.css $c -Encoding UTF8
git add app/|Out-Null;git commit -m "fix: logo com fallback + grade 2x2 no celular + nav Apuracoes"|Out-Null;git push origin master|Out-Null
Write-Host 'PUSH OK' -ForegroundColor Green
$ok=$false
for($t=1;$t -le 3;$t++){Start-Sleep 50;try{
$js=(Invoke-WebRequest 'https://raw.githubusercontent.com/xbrancox/mudabrasil/master/app/app.js' -UseBasicParsing).Content
$cs=(Invoke-WebRequest 'https://raw.githubusercontent.com/xbrancox/mudabrasil/master/app/app.css' -UseBasicParsing).Content
$lg=Invoke-WebRequest 'https://raw.githubusercontent.com/xbrancox/mudabrasil/master/app/logo.svg' -UseBasicParsing -TimeoutSec 15
if($js.Contains('onerror="this.remove()"') -and $js.Contains($acc) -and $cs.Contains('VB-OVERRIDE2') -and $lg.Content.Contains('svg')){Write-Host "TENTATIVA $t : TUDO NO AR" -ForegroundColor Green;$ok=$true;break}else{Write-Host "TENTATIVA $t : cache do GitHub…" -ForegroundColor Yellow}
}catch{Write-Host "TENTATIVA $t : rede oscilou" -ForegroundColor Yellow}}
if($ok){Write-Host 'FECHADO: abra o app 2x no celular.' -ForegroundColor Cyan}else{Write-Host 'AINDA NAO: me manda este print.' -ForegroundColor Red}
Read-Host "Enter"