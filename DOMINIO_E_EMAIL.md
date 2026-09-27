# 🌐 Registro de Domínio e E-mail — VotaBrasil

> **Domínio escolhido**: `votabrasil.app.br` ✅ (RDAP confirmou LIVRE em 27/09/2026)
> **Registrador**: Registro.br (NIC.br) — R$40/ano no PIX
> **E-mail**: Zoho Mail Free (3 caixas: contato@, anuncie@, imprensa@)
> **Quem faz o quê**: VOCÊ clica (~10 minutos); EU já deixei tudo pronto nos scripts.

---

## 📋 Resumo do plano (leia antes)

| # | Ação | Quem | Tempo |
|---|------|------|-------|
| 1 | Registrar `votabrasil.app.br` no Registro.br | 👤 VOCÊ | 5 min + PIX |
| 2 | Rodar `scripts\RODAR-DOMINIO.bat` (atualiza e-mails no site + commit) | 👤 VOCÊ | 2 cliques |
| 3 | Criar os 9 registros DNS no painel do Registro.br | 👤 VOCÊ | 10 min (copiar/colar) |
| 4 | Criar conta Zoho Mail + adicionar domínio + verificar | 👤 VOCÊ | 15 min |
| 5 | Me avisar no chat "domínio pronto" | 👤 VOCÊ | 1 min |
| 6 | Testar ao vivo e validar certificado SSL | 🤖 EU | auto |

---

## 🔐 PASSO 1 — Registrar o domínio no Registro.br

> Por que Registro.br e não Cloudflare?
> - `.app.br` é um domínio **brasileiro**, gerenciado pelo NIC.br (não existe na Cloudflare).
> - Preço oficial: **R$ 40/ano** (contra R$ ~70/ano do `.app` internacional).
> - Pagamento via **PIX na hora**, sem cartão.

### Clique a clique

1. Abra em aba anônima (pra não pegar cache):
   **https://registro.br/dominio/**
2. No campo de busca, digite **`votabrasil.app.br`** e clique em **Pesquisar**.
3. Deve aparecer: **"Disponível — Registrar agora"**. Se aparecer "Já registrado", me avise que escolho outro.
4. Clique em **Registrar** ao lado do `votabrasil.app.br`.
5. Vai pedir login:
   - **Se já tem conta Registro.br**: faça login com seu CPF + senha.
   - **Se NÃO tem**: clique em **"Crie uma conta"** → use seu **CPF** (não precisa CNPJ — `.app.br` aceita pessoa física) → preencha nome, e-mail, telefone.
6. Escolha o período: **1 ano** (mínimo) = **R$ 40,00**.
7. Pagamento: escolha **PIX** → copia o QR ou o código "copia e cola" → paga no banco.
8. Aguarda ~2 minutos → o domínio aparece no seu painel em **"Meus Domínios"**.

✅ Pronto! O domínio é seu. Agora vamos configurar o DNS.

---

## ⚙️ PASSO 2 — Rodar o script do projeto (2 cliques)

Já gravei 3 arquivos no seu projeto:
- `CNAME` → avisa o GitHub Pages que `votabrasil.app.br` é o domínio oficial
- `scripts\CONFIGURAR-DOMINIO.ps1` → troca os e-mails do `config.js` e os `<meta>` do `index.html`
- `scripts\RODAR-DOMINIO.bat` → executa o script acima com 2 cliques

### Clique a clique

1. Abra o Explorer em `C:\Users\euler\votabrasil`.
2. Entre na pasta `scripts`.
3. Clique com o botão direito em `RODAR-DOMINIO.bat` → **Executar como administrador**.
4. Uma janela azul do PowerShell vai abrir e mostrar:
   - backup automático em `backup-dominio-AAAA-MM-DD-HHMMSS\`
   - substituições no `config.js` (3 e-mails: contato/anuncie/imprensa)
   - substituições no `index.html` (canonical + og:url + og:image + twitter:image)
   - commit automático + push pro GitHub

5. Aguarde a mensagem **"✅ Configuração concluída"** e pressione ENTER para fechar.

> Se der qualquer erro, copia a mensagem da janela e me manda aqui.

---

## 🧭 PASSO 3 — Criar os registros DNS no Registro.br

Estes registros fazem o domínio apontar pro GitHub Pages e pro Zoho Mail.

### Como acessar o painel de DNS

1. Em **https://registro.br**, faça login → **Meus Domínios**.
2. Clique em cima de **`votabrasil.app.br`**.
3. Role até **"Servidores DNS"** → clique em **"Alterar servidores DNS"** → escolha a opção **"Usar DNS do Registro.br"** (modo avançado / editar zonas).
4. Aparece a tela de **Editor de Zona** (ou "Zona DNS").

### Registros a adicionar (copie/cole)

Adicione **um por um** na ordem abaixo. Cada linha = 1 registro. Salve a cada 2 ou 3.

#### 🔵 Bloco A — GitHub Pages (para o site funcionar)

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| **A** | `@` (ou deixe em branco) | `185.199.108.153` | 3600 |
| **A** | `@` | `185.199.109.153` | 3600 |
| **A** | `@` | `185.199.110.153` | 3600 |
| **A** | `@` | `185.199.111.153` | 3600 |
| **AAAA** | `@` | `2606:50c0:8000::153` | 3600 |
| **AAAA** | `@` | `2606:50c0:8001::153` | 3600 |
| **AAAA** | `@` | `2606:50c0:8002::153` | 3600 |
| **AAAA** | `@` | `2606:50c0:8003::153` | 3600 |
| **CNAME** | `www` | `xbrancox.github.io.` | 3600 |

> **Atenção:** no CNAME do `www`, coloque um **ponto final** depois de `github.io` (`xbrancox.github.io.`). É o padrão DNS.

#### 🟣 Bloco B — Zoho Mail (para receber e-mails) — **só depois de criar a conta Zoho no PASSO 4**

| Tipo | Nome | Valor | Prioridade/TTL |
|------|------|-------|----------------|
| **MX** | `@` | `mx.zohomail.com` | prio **10** / TTL 3600 |
| **MX** | `@` | `mx2.zohomail.com` | prio **20** / TTL 3600 |
| **MX** | `@` | `mx3.zohomail.com` | prio **50** / TTL 3600 |
| **TXT** | `@` | `v=spf1 include:zoho.com ~all` | TTL 3600 |
| **TXT** | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@votabrasil.app.br; ruf=mailto:dmarc@votabrasil.app.br; pct=100;` | TTL 3600 |

> ⚠️ O registro **DKIM** (`selector._domainkey`) só aparece **depois** que você cria a conta Zoho — o Zoho gera um seletor único e te dá o valor exato. Não dá pra adiantar.

---

## 📬 PASSO 4 — Criar conta Zoho Mail e adicionar o domínio

### 4.1 — Criar a conta Zoho

1. Acesse: **https://www.zoho.com/mail/zohomail-pricing.html**
2. Role até o plano **"Forever Free Plan"** (3 usuários, 5GB cada, domínio próprio).
3. Clique em **Sign Up Now**.
4. Na tela de inscrição, **NÃO use "zoho.com"** como domínio. Escolha **"I have a domain"** e digite `votabrasil.app.br`.
5. Preencha:
   - Username: `admin` (fica `admin@votabrasil.app.br`)
   - Password: uma senha forte (guarda!)
   - Nome: seu nome completo
   - País: **Brazil**
6. Confirme o e-mail de verificação que o Zoho manda pro e-mail que você usou no cadastro.

### 4.2 — Verificar posse do domínio

O Zoho vai pedir pra você provar que é dono do domínio. Ele dá **3 opções** (escolha a mais fácil):

- ✅ **TXT record** (recomendado): o Zoho mostra um código tipo `zoho-verification=abc123xyz`. Copie e cole no painel do Registro.br como um registro **TXT** com nome `@`.
- CNAME record (alternativa)
- HTML file upload (alternativa)

Depois de colar o TXT, volta no Zoho e clica em **"Verify"**. Pode levar de 5 a 30 minutos pra propagar.

### 4.3 — Adicionar os MX e criar as 3 caixas

1. Após verificação, o Zoho mostra uma tela pedindo pra adicionar **MX records**. Ele já mostra os 3 valores da tabela do PASSO 3 (mx, mx2, mx3).
2. Volta no painel do Registro.br e adiciona os 3 MX (prio 10, 20, 50).
3. Volta no Zoho e clica em **"Verify MX"**.
4. Adicione os outros 2 registros TXT (SPF e DMARC) da tabela do PASSO 3.
5. Na tela de **"Email Hosting"**, clique em **"Add User"** duas vezes pra criar:
   - `contato@votabrasil.app.br` (senha forte)
   - `anuncie@votabrasil.app.br` (senha forte)
   - `imprensa@votabrasil.app.br` (senha forte)
6. Em **"DKIM Configuration"** o Zoho gera um seletor tipo `zmail._domainkey` com um valor enorme. **Copia esse valor e me manda no chat** — eu te digo exatamente onde colar no Registro.br (registro CNAME especial).

### 4.4 — Teste final

- Entra em **https://mail.zoho.com** com `admin@votabrasil.app.br` + senha.
- Envia um e-mail de teste pra seu Gmail pessoal.
- Pede pra alguém mandar um e-mail pra `contato@votabrasil.app.br`.
- Se receber e enviar nos dois sentidos → **e-mail funcionando! 🎉**

---

## ✅ PASSO 5 — Me avisa no chat

Quando terminar o PASSO 4 (ou mesmo antes, só com o PASSO 3 feito), me manda:

> **"domínio votabrasil.app.br registrado e DNS configurado"**

Eu automaticamente:
1. Faço o **TESTAR.bat** pra verificar o certificado SSL do GitHub Pages (demora ~30 min pra o Let's Encrypt emitir).
2. Testo se `https://votabrasil.app.br/` resolve.
3. Testo se os MX do Zoho propagaram (via lookup DNS).
4. Te mando o relatório final.

---

## 🚨 Regras de Balde (segurança)

Durante essa fase:
- ❌ **NÃO** altero nada no backend Railway até o domínio próprio do backend (`api.votabrasil.app.br` ou similar) estiver registrado e testado.
- ✅ Trocar os e-mails de contato no `config.js` é **seguro** — o site já funciona, só muda o texto do rodapé e dos links "mailto:".
- ✅ O arquivo `CNAME` na raiz do repo não quebra nada enquanto o domínio não propagar — o GitHub Pages simplesmente ignora se não houver DNS apontando.
- ⚠️ **Não** mude ainda a URL do backend (`API_BASE` no config.js) — isso requer configurar o domínio no painel do Railway depois.

---

## 💰 Custos totais

| Item | Valor | Onde |
|------|-------|------|
| Domínio `votabrasil.app.br` (1 ano) | R$ 40,00 | Registro.br (PIX) |
| Zoho Mail Free | R$ 0,00 | zoho.com |
| GitHub Pages | R$ 0,00 | incluso |
| **TOTAL** | **R$ 40,00** | |

---

## 📎 Arquivos criados no projeto

```
C:\Users\euler\votabrasil\
├── CNAME                           ← avisa GitHub Pages do domínio
├── DOMINIO_E_EMAIL.md              ← este guia
└── scripts\
    ├── CONFIGURAR-DOMINIO.ps1      ← atualiza config.js + index.html
    └── RODAR-DOMINIO.bat           ← executa o .ps1 com 2 cliques
```

Backup automático fica em `C:\Users\euler\votabrasil\backup-dominio-AAAA-MM-DD-HHMMSS\`.
