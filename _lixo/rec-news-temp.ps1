$env:PYTHONIOENCODING='utf-8'
$urls = @(
  'https://autoglm-oss.z.ai/auto_fly/zzqew7_20260904-171726-9cacb694-8d2-Capturadetela2026-09-04170611.jpg?auth_key=1788553198-0-0-8095e6fb7392fb0fdc713f5f68b74bac',
  'https://autoglm-oss.z.ai/auto_fly/5hajm6_20260904-171726-fdcafafc-a48-Capturadetela2026-09-04165003.jpg?auth_key=1788553199-0-0-2f3fe9655a3400a3046ecd7b2d2057e0',
  'https://autoglm-oss.z.ai/auto_fly/mm564l_20260904-171726-54fa1b4a-948-Capturadetela2026-09-04171619.png?auth_key=1788553201-0-0-1acf433dc8a307c309b1a95f78202b40',
  'https://autoglm-oss.z.ai/auto_fly/byu494_20260904-171726-ce8932fc-3d6-Capturadetela2026-09-04171549.png?auth_key=1788553202-0-0-e5d056804dd0c70ca70602179a922630'
)
$i = 1
foreach ($u in $urls) {
  python 'C:\Users\euler\.openclaw-autoclaw\skills\autoglm-image-recognition\image-recognition.py' $u 'Descreva este print da plataforma MudaBrasil em detalhe: layout, secoes, textos visiveis, elementos que lembram "acompanhamento", "atualizacoes", noticias ou carrossel. Onde na pagina esse conteudo esta localizado (topo/meio/rodape)? Seja completo.' | Out-File -FilePath ('C:\Users\euler\MudaBrasil\rec-news-' + $i + '.txt') -Encoding utf8
  $i++
}
