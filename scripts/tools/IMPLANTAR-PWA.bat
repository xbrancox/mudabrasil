@echo off
setlocal
title VotaBrasil - PWA Instalavel (v8) + LOG
cd /d "%~dp0"
set "LOG=%~dp0LOG-PWA.txt"
echo Log: %LOG%
call :MAIN > "%LOG%" 2>&1
type "%LOG%"
echo.
pause
exit /b 0

:MAIN
echo VotaBrasil - PWA instalavel (v8) - 22/09/2026
echo.
del /q pwa-head.html 2>nul

echo [1/5] Gravando MudaBrasil\manifest.webmanifest ...
echo {> "MudaBrasil\manifest.webmanifest"
echo   "name": "VotaBrasil - Cobre, Revogue, Vote",>> "MudaBrasil\manifest.webmanifest"
echo   "short_name": "VotaBrasil",>> "MudaBrasil\manifest.webmanifest"
echo   "description": "Plataforma civica de voto continuo e revogavel. Seu voto coloca, seu voto tira.",>> "MudaBrasil\manifest.webmanifest"
echo   "start_url": "./",>> "MudaBrasil\manifest.webmanifest"
echo   "scope": "./",>> "MudaBrasil\manifest.webmanifest"
echo   "display": "standalone",>> "MudaBrasil\manifest.webmanifest"
echo   "background_color": "#0B132B",>> "MudaBrasil\manifest.webmanifest"
echo   "theme_color": "#0B132B",>> "MudaBrasil\manifest.webmanifest"
echo   "icons": [>> "MudaBrasil\manifest.webmanifest"
echo     { "src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },>> "MudaBrasil\manifest.webmanifest"
echo     { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },>> "MudaBrasil\manifest.webmanifest"
echo     { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" },>> "MudaBrasil\manifest.webmanifest"
echo     { "src": "icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any" }>> "MudaBrasil\manifest.webmanifest"
echo   ]>> "MudaBrasil\manifest.webmanifest"
echo }>> "MudaBrasil\manifest.webmanifest"
echo   [OK] manifest.webmanifest

echo [2/5] Gravando MudaBrasil\sw.js ...
echo /* VotaBrasil Service Worker v8 */> "MudaBrasil\sw.js"
echo var CACHE = 'vb-v8';>> "MudaBrasil\sw.js"
echo var CORE = [>> "MudaBrasil\sw.js"
echo   './',>> "MudaBrasil\sw.js"
echo   './index.html',>> "MudaBrasil\sw.js"
echo   './manifest.webmanifest',>> "MudaBrasil\sw.js"
echo   './icon-192.png',>> "MudaBrasil\sw.js"
echo   './icon-512.png',>> "MudaBrasil\sw.js"
echo   './icon.svg',>> "MudaBrasil\sw.js"
echo   './config.js',>> "MudaBrasil\sw.js"
echo   './core.js',>> "MudaBrasil\sw.js"
echo   './pdf-cassacao.js',>> "MudaBrasil\sw.js"
echo   './notificacoes-pwa.js'>> "MudaBrasil\sw.js"
echo ];>> "MudaBrasil\sw.js"
echo self.addEventListener('install', function (e) {>> "MudaBrasil\sw.js"
echo   e.waitUntil(caches.open(CACHE).then(function (c) {>> "MudaBrasil\sw.js"
echo     return c.addAll(CORE).catch(function () {>> "MudaBrasil\sw.js"
echo       return Promise.all(CORE.map(function (u) { return c.add(u).catch(function () {}); }));>> "MudaBrasil\sw.js"
echo     });>> "MudaBrasil\sw.js"
echo   }).then(function () { return self.skipWaiting(); }));>> "MudaBrasil\sw.js"
echo });>> "MudaBrasil\sw.js"
echo self.addEventListener('activate', function (e) {>> "MudaBrasil\sw.js"
echo   e.waitUntil(caches.keys().then(function (ks) {>> "MudaBrasil\sw.js"
echo     return Promise.all(ks.map(function (k) { if (k !== CACHE) { return caches.delete(k); } }));>> "MudaBrasil\sw.js"
echo   }).then(function () { return self.clients.claim(); }));>> "MudaBrasil\sw.js"
echo });>> "MudaBrasil\sw.js"
echo self.addEventListener('fetch', function (e) {>> "MudaBrasil\sw.js"
echo   if (e.request.method !== 'GET') { return; }>> "MudaBrasil\sw.js"
echo   e.respondWith(caches.match(e.request).then(function (hit) {>> "MudaBrasil\sw.js"
echo     var net = fetch(e.request).then(function (r) {>> "MudaBrasil\sw.js"
echo       if (r && r.ok && r.type === 'basic') {>> "MudaBrasil\sw.js"
echo         var cp = r.clone();>> "MudaBrasil\sw.js"
echo         caches.open(CACHE).then(function (c) { c.put(e.request, cp); });>> "MudaBrasil\sw.js"
echo       }>> "MudaBrasil\sw.js"
echo       return r;>> "MudaBrasil\sw.js"
echo     }).catch(function () { return hit || caches.match('./index.html'); });>> "MudaBrasil\sw.js"
echo     return hit || net;>> "MudaBrasil\sw.js"
echo   }));>> "MudaBrasil\sw.js"
echo });>> "MudaBrasil\sw.js"
echo   [OK] sw.js

echo [2.5] Gravando MudaBrasil\icon.svg ...
echo ^<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"^>^<rect width="512" height="512" rx="96" fill="#0B132B"/^>^<polyline points="128,266 215,348 384,164" fill="none" stroke="#009739" stroke-width="56" stroke-linecap="round" stroke-linejoin="round"/^>^<circle cx="368" cy="330" r="36" fill="#FFD700"/^>^</svg^>>> "MudaBrasil\icon.svg"
echo   [OK] icon.svg

echo [3/5] Gerando icon-192.png e icon-512.png via System.Drawing ...
powershell -NoProfile -Command "Add-Type -AssemblyName System.Drawing; foreach($s in @(192,512)){ $b=New-Object System.Drawing.Bitmap $s,$s; $g=[System.Drawing.Graphics]::FromImage($b); $g.SmoothingMode='AntiAlias'; $g.Clear([System.Drawing.Color]::FromArgb(255,11,19,43)); $pen=New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255,0,151,57),[single]($s*0.11)); $pen.StartCap='Round'; $pen.EndCap='Round'; $pen.LineJoin='Round'; $pts=@((New-Object System.Drawing.Point([int]($s*0.25),[int]($s*0.52))),(New-Object System.Drawing.Point([int]($s*0.42),[int]($s*0.68))),(New-Object System.Drawing.Point([int]($s*0.75),[int]($s*0.32)))); $g.DrawLines($pen,$pts); $br=New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255,255,215,0)); $g.FillEllipse($br,[int]($s*0.66),[int]($s*0.60),[int]($s*0.14),[int]($s*0.14)); $out=(Join-Path (Get-Location).Path ('MudaBrasil\icon-'+$s+'.png')); $b.Save($out,[System.Drawing.Imaging.ImageFormat]::Png); $g.Dispose(); $b.Dispose(); Write-Host ('  [OK] icon-'+$s+'.png') }"
if errorlevel 1 echo   [WARN] falha em desenhar PNGs (instalacao continua com SVG)

echo [4/5] Patch em MudaBrasil\index.html (manifest + theme + sw register) ...
echo ^<link rel="manifest" href="manifest.webmanifest"^>>> "pwa-head.html"
echo ^<meta name="theme-color" content="#0B132B"^>>> "pwa-head.html"
echo ^<link rel="apple-touch-icon" href="icon-192.png"^>>> "pwa-head.html"
echo ^<script^>if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js');});}^</script^>>> "pwa-head.html"
powershell -NoProfile -Command "$h=[IO.File]::ReadAllText('pwa-head.html'); $p='MudaBrasil\index.html'; $c=[IO.File]::ReadAllText($p); if($c.Contains('manifest.webmanifest')){ 'JA-PATCHED' } else { $c=$c.Replace('</body>', $h+[char]10+'</body>'); [IO.File]::WriteAllText($p,$c); 'PATCH-OK' }"
del /q pwa-head.html 2>nul

echo [5/5] Commit e push ...
git add -A
git commit -m "feat: PWA instalavel (manifest + sw + icons) v8"
git push origin main
echo.
echo [4/4] Concluido.
echo Confira em ~2 min: https://xbrancox.github.io/mudabrasilv4/
echo.
echo Teste no Chrome: menu > Install VotaBrasil (ou icone de install na barra de endereco).
exit /b 0
