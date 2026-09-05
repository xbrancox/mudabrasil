$env:PYTHONIOENCODING='utf-8'
$dir = 'C:\Users\euler\.openclaw-autoclaw\workspace\.openclaw-attachments'
$files = @(
  '20260904-171726-9cacb694-8d2-Captura de tela 2026-09-04 170611.jpg',
  '20260904-171726-fdcafafc-a48-Captura de tela 2026-09-04 165003.jpg',
  '20260904-171726-54fa1b4a-948-Captura de tela 2026-09-04 171619.png',
  '20260904-171726-ce8932fc-3d6-Captura de tela 2026-09-04 171549.png'
)
$i = 1
foreach ($f in $files) {
  python 'C:\Users\euler\.openclaw-autoclaw\skills\autoglm-image-recognition\upload-mix.py' (Join-Path $dir $f) | Out-File -FilePath ('C:\Users\euler\MudaBrasil\up-' + $i + '.json') -Encoding utf8
  $i++
}
