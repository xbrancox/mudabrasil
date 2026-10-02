# Refresh data/pls.json from Câmara dos Deputados API
$ErrorActionPreference = 'Stop'

Write-Host "Fetching PLs from Câmara API..."
$r = Invoke-RestMethod -Uri 'https://dadosabertos.camara.leg.br/api/v2/proposicoes?itens=30&ordem=DESC&ordenarPor=id' -UseBasicParsing -TimeoutSec 30

$pls = @()
foreach ($p in $r.dados) {
    $num = ''
    $ano = ''
    if ($p.numero -match '(\d+)/(\d{4})') {
        $num = $Matches[1]
        $ano = $Matches[2]
    } elseif ($p.numero -match '(\d+)') {
        $num = $Matches[1]
        $ano = $p.ano
    }
    
    $title = if ($p.ementa.Length -gt 140) { $p.ementa.Substring(0, 140) } else { $p.ementa }
    
    $pls += [pscustomobject]@{
        id = "pl-camara-$($p.id)"
        camaraId = [string]$p.id
        number = "$num/$ano"
        year = [int]$ano
        author = $p.autor
        party = $p.siglaPartido
        uf = $p.siglaUf
        title = $title
        ementa = $p.ementa
        status = $p.status
        chamber = 'Câmara'
        tema = $null
        url = "https://www.camara.leg.br/proposicoesweb/fichadetalhamento?idProposicao=$($p.id)"
    }
}

$out = [pscustomobject]@{
    mode = 'real'
    source = 'Câmara dos Deputados (Dados Abertos)'
    total = $pls.Count
    atualizadoEm = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
    pls = $pls
}

$out | ConvertTo-Json -Depth 5 -Compress | Out-File -FilePath 'C:\Users\euler\votabrasil\data\pls.json' -Encoding utf8
Write-Host "OK: $($pls.Count) PLs refreshed at $(Get-Date)"
