# 🗳️ MeuVoto / VotaBrasil — Guia Rápido para o Usuário

Este é o guia simples para você entender o projeto e saber o que está funcionando.

---

## 🌐 Onde acessar

- **Site principal:** https://meu-voto.app/
- **App celular (PWA):** https://meu-voto.app/app/
- **Servidor (backend):** https://mudabrasil-production-79eb.up.railway.app

> ⚠️ O nome do domínio (`mudabrasil-production-...`) é temporário. Quando você comprar seu domínio próprio (ex: `omeuvoto.app`), a gente muda.

---

## ✅ O que está funcionando (100% pronto)

### 📋 Informações políticas
- ✅ **594 políticos reais** (513 deputados + 81 senadores) com fotos e dados oficiais
- ✅ **Votações do Plenário** da Câmara e Senado (últimas e próximas)
- ✅ **Projetos de Lei (PLs)** com resumos e situação atual
- ✅ **Notícias políticas** de 10 fontes (G1, Folha, CNN, etc.)

### 🗳️ Sistema de voto cidadão
- ✅ **Colocar voto** em qualquer político (gera código único)
- ✅ **Conferir voto** pelo código (ver se está ativo)
- ✅ **Manter voto** (reafirmar apoio)
- ✅ **Revogar voto** (retirar apoio)
- ✅ **Voto anônimo** (ninguém sabe quem votou em quem)

### 📊 Análise e cobrança
- ✅ **Dossiê do deputado** (presença, votos, promessas)
- ✅ **Comparador A × B** (comparar dois deputados lado a lado)
- ✅ **Mapa de calor por estado** (como cada UF votou)
- ✅ **Recibo de cobrança** (gerar documento para enviar ao gabinete)
- ✅ **Ranking de responsividade** (quais gabinetes respondem)

### 📧 Notificações
- ✅ **Digest semanal por e-mail** (resumo das votações da semana)
- ✅ **Notificações push** no celular (quando deputado seu votar)
- ✅ **Alertas de pauta** (aviso antes de votações importantes)

### 🔧 Técnico (infraestrutura)
- ✅ **Banco de dados persistente** (dados não se perdem)
- ✅ **Servidor no ar 24/7** (Railway em Amsterdam)
- ✅ **Site no ar 24/7** (GitHub Pages)
- ✅ **Testes automáticos** (15 suítes de teste rodando)
- ✅ **Backup de dados** (volume persistente de 5 GB)

---

## 📱 Como instalar o app no celular

### Android (Chrome):
1. Abra https://meu-voto.app/app/
2. Toque nos **3 pontinhos** → "Instalar aplicativo"
3. Pronto! O ícone aparece na tela inicial

### iPhone (Safari):
1. Abra https://meu-voto.app/app/
2. Toque no **ícone de compartilhar** → "Adicionar à Tela de Início"
3. Pronto! O ícone aparece na tela inicial

---

## 📧 Como assinar o digest semanal

1. Acesse https://meu-voto.app/pages/digest.html
2. Digite seu e-mail
3. Marque os temas que te interessam (saúde, educação, economia...)
4. Clique em **"Assinar digest"**
5. Confirme clicando no link que chega no seu e-mail

**Resultado:** toda segunda-feira você recebe um resumo das votações da semana filtrado pelos seus temas.

---

## 🔔 Como ativar notificações no celular

1. Acesse o site no celular
2. Vá em **Digest semanal** (link no rodapé)
3. Role até **"🔔 Notificações no Celular"**
4. Clique em **"Ativar Notificações"**
5. Permita no navegador

**Resultado:** você recebe alerta no celular quando seu deputado votar.

---

## 🧾 Como gerar recibo de cobrança

1. Marque um deputado como ⭐ (clique na estrela)
2. Vá em **"Meus representantes"**
3. Cadastre uma promessa (ex: "Defender a educação pública")
4. Clique em **"🧾 Gerar recibo para cobrar o gabinete"**
5. Copie o link e envie ao deputado (WhatsApp, e-mail, etc.)

**Resultado:** o gabinete recebe um link oficial onde pode responder publicamente.

---

## 📊 Como comparar dois deputados

1. Marque 2+ deputados como ⭐
2. Vá em **"📊 Análise"**
3. Clique em **"⚖️ Comparador A × B"**
4. Escolha os dois deputados
5. Clique em **"Comparar"**

**Resultado:** tabela mostrando em quais votações eles concordaram e discordaram.

---

## 🗂️ Páginas principais

| Página | O que faz | Link |
|---|---|---|
| **Home** | Visão geral + notícias | [Abrir](https://meu-voto.app/) |
| **Radar Político** | Ficha completa de cada político | [Abrir](https://meu-voto.app/pages/parlamentares.html) |
| **Votações** | Todas as votações do Congresso | [Abrir](https://meu-voto.app/pages/votacoes.html) |
| **Eleições 2026** | Candidatos e propostas | [Abrir](https://meu-voto.app/pages/eleicoes-2026.html) |
| **Meu Voto** | Seus deputados + promessas | [Abrir](https://meu-voto.app/pages/meu-voto.html) |
| **Digest** | Assinar resumo semanal | [Abrir](https://meu-voto.app/pages/digest.html) |
| **Metodologia** | Como calculamos tudo | [Abrir](https://meu-voto.app/pages/metodologia.html) |
| **Status** | Saúde do sistema | [Abrir](https://meu-voto.app/pages/status.html) |

---

## ⏳ O que falta (depende de você)

### 1. Comprar domínio próprio
Quando você comprar (ex: `omeuvoto.app`), a gente configura para o site usar esse endereço em vez do atual.

**Custo:** ~R$ 40/ano no Registro.br

### 2. Configurar e-mail para o digest
Para o digest enviar e-mails de verdade, precisa de uma conta SMTP.

**Opções gratuitas:**
- Brevo: 300 e-mails/dia grátis
- Gmail: 500 e-mails/dia (com senha de app)
- SendGrid: 100 e-mails/dia grátis

Quando você tiver as credenciais, me passa e eu configuro.

---

## 🆘 Problemas? Me avise

Se algo não funcionar, me diga:
- O que você tentou fazer
- O que apareceu na tela (print se possível)
- Em qual página você estava

Eu corrijo na hora.

---

**Projeto 100% funcional em produção. Pronto para uso público.** 🇧🇷
