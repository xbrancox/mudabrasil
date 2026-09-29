# Idempotente: valida por ancora antes de tocar em qualquer arquivo.
[Console]::OutputEncoding=[System.Text.UTF8Encoding]::new()
$repo='C:\Users\euler\votabrasil'
[Environment]::CurrentDirectory=$repo
Set-Location $repo
function Say($m){ Write-Host $m }
if(-not (Test-Path (Join-Path $repo 'index.html'))){ Say 'ERRO: repo nao achado'; pause; exit 1 }

# [1] FAQ ja injetado diretamente por edicao de arquivo (verifica idempotencia)
$idx=Join-Path $repo 'index.html'
$c=[IO.File]::ReadAllText($idx)
if($c.Contains('id="faq"')){ Say '[1] FAQ ja no site (idempotente)' } else { Say '[1] FAQ AUSENTE - verificar edicao manual' }

# [2] Microcopy no app (procura ancoras reais ANTES de trocar)
$app=Join-Path $repo 'app\index.html'
if(Test-Path $app){
  $ca=[IO.File]::ReadAllText($app)
  $changes=0
  # trocar so se a ancora existir e o novo texto ainda nao estiver la
  $subs=@(
    @('Conferir voto','Conferir meu voto'),
    @('Conferir Voto','Conferir meu voto'),
    @('Revogar Voto','Revogar voto'),
    @('Código inválido','Esse c&#243;digo n&#227;o confere. Confira os 20 d&#237;gitos, sem espa&#231;os.'),
    @('Voto salvo','Voto registrado. Guarde seu c&#243;digo: ele &#233; a sua prova.')
  )
  foreach($s in $subs){
    $old=$s[0]; $new=$s[1]
    if($ca.Contains($old) -and -not $ca.Contains($new)){
      $ca=$ca.Replace($old,$new); $changes++
    }
  }
  if($changes -gt 0){
    [IO.File]::WriteAllText($app,$ca,(New-Object System.Text.UTF8Encoding $false))
    Say ('[2] microcopy aplicado ('+$changes+' substituicoes)')
  } else {
    Say '[2] microcopy: nada a trocar (ja aplicado ou ancoras ausentes)'
  }
} else {
  Say '[2] app/index.html nao existe (pulando)'
}

# [3] Pagina roadmap ja criada diretamente por edicao de arquivo
$roadmapPath=Join-Path $repo 'pages\roadmap.html'
if(Test-Path $roadmapPath){ Say '[3] pages/roadmap.html existe' } else { Say '[3] pages/roadmap.html AUSENTE' }

# [4] Resumo final
Say ''
Say '=============== VERIFICACAO ==============='
$idx2=[IO.File]::ReadAllText($idx)
Say ('FAQ no site         : '+$idx2.Contains('id="faq"'))
Say ('Pagina roadmap      : '+(Test-Path $roadmapPath))
Say ('')
Say 'Agora rode COMMIT-E-PUSH.bat (dois cliques) para publicar.'
pause
