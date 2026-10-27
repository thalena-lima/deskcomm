# Como subir o seu DeskcommCRM na Hostinger (passo a passo, sem enrolação)

Este guia leva você do zero — sem servidor, sem nada — até o seu CRM no ar numa **VPS da
Hostinger**, com WhatsApp conectado e IA respondendo. **Não precisa saber programar.** Se travar
em algum passo, o assistente do Claude Code faz por você (veja o [Caminho fácil](#caminho-fácil-o-claude-code-faz-por-você)).

> ⏱️ Tempo estimado: **20 a 40 minutos**, a maior parte esperando o domínio "propagar".
> 💰 Custo: o software é **grátis**. Você paga só a hospedagem (VPS) e, se quiser, a IA por uso.

> ℹ️ O instalador vive numa pasta chamada `hostgator-setup-kit` — é o nome que ela tem no
> projeto original. **O conteúdo é o mesmo para qualquer VPS**, e ele já sabe lidar com a
> Hostinger. Não estranhe o nome nos comandos.

---

## Visão geral (o que vamos montar)

```
Seu domínio  →  Servidor VPS (Hostinger)  →  DeskcommCRM rodando
                        │
                        ├─ o CRM (site + painel)
                        ├─ o WhatsApp (conectado por QR)
                        └─ os robôs de IA
Banco de dados: Supabase (grátis)   ·   IA: OpenRouter, Anthropic ou OpenAI (paga por uso)
```

---

## Antes de começar, você vai precisar de 3 contas

| O quê | Onde | Custo |
|---|---|---|
| **Servidor VPS** | Hostinger ([link abaixo](#passo-1--contrate-o-servidor-vps-na-hostinger)) | pago (mensal) |
| **Banco de dados** | [supabase.com](https://supabase.com) | grátis |
| **IA** | [openrouter.ai](https://openrouter.ai), [console.anthropic.com](https://console.anthropic.com) ou [platform.openai.com](https://platform.openai.com) | pago por uso |

Crie a conta do Supabase e a da IA agora (leva 2 min cada). O VPS a gente contrata no passo 1.

---

## Passo 1 — Contrate o servidor (VPS) na Hostinger

👉 **[Assinar a VPS Hostinger com o meu link](https://www.hostg.xyz/aff_c?offer_id=6&aff_id=221622&url_id=5038&source=deskcomm)**

**Plano recomendado: KVM 2** (2 vCPU / 8 GB de RAM). O mínimo que o CRM pede para operar é
**2 vCPU e 4 GB** — o WhatsApp usa cerca de 150 MB por número conectado, e são 7 serviços
rodando juntos. O KVM 1 (1 vCPU) sobe, mas opera no limite.

Na configuração da VPS, o painel da Hostinger pede três escolhas:

1. **Localização do servidor:** escolha **Brasil** (São Paulo). É o que segura a latência do
   WhatsApp para quem atende no Brasil.
2. **Sistema operacional:** escolha **Ubuntu 24.04** (ou 22.04) **sem aplicativo**. Se o painel
   oferecer "Ubuntu com Docker", também serve. Evite templates com aplicativo pronto (n8n,
   Coolify etc.) numa VPS só para o CRM — eles trazem um proxy próprio, e aí o instalador faz
   uma pergunta a mais (está explicado no [Passo 5](#a-pergunta-do-proxy-só-em-algumas-vps)).
3. **Senha do root:** crie uma senha forte e **guarde**. É com ela que você entra no servidor.

Quando a VPS ficar pronta, o painel mostra o **IP do servidor**. Anote.

> Já tem uma VPS da Hostinger com outra coisa rodando (n8n, por exemplo)? Funciona também — o
> instalador publica o CRM pelo proxy que já está lá, sem derrubar o que existe.

---

## Passo 2 — Entre no servidor

No seu computador, abra o **Terminal** (no Windows: "PowerShell"; no Mac: "Terminal") e digite,
trocando pelo IP do painel:

```bash
ssh root@SEU-IP-AQUI
```

A Hostinger usa a porta **22**, a padrão do SSH — não precisa de `-p`.

Ele vai pedir a senha do root (ao digitar, não aparece nada na tela — é normal). Deu certo?
Você está "dentro" do servidor.

> Na primeira conexão ele pergunta `Are you sure you want to continue connecting?` — responda
> `yes`. É o servidor se apresentando pela primeira vez.

> 💡 Sem terminal no computador? O painel da VPS na Hostinger tem um **terminal no navegador**.
> Ele serve para tudo deste guia.

**Agora libere as portas do site** (sem isso o cadeado de segurança/SSL não funciona):

```bash
ufw allow 22,80,443/tcp && ufw --force enable
```

⚠️ A **22** precisa estar na lista — é por ela que você entra. Sem ela, o firewall te **tranca
pra fora do servidor**.

> Se você ativou o **firewall no painel da Hostinger**, libere lá também as portas **22**,
> **80** e **443**. Este é o motivo nº 1 de o site não abrir depois de instalar.

---

## Passo 3 — Crie o banco de dados (Supabase, grátis)

> 💡 **Atalho:** se você criar um **token de acesso** em
> [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens), o
> instalador cria o projeto sozinho e acha todas as chaves — pode pular este passo e só colar o
> token quando ele pedir.

Sem o token, faça na mão:

1. Entre em [supabase.com](https://supabase.com) → **New project**.
2. Escolha a região **South America (São Paulo)** e uma senha forte para o banco (guarde).
3. Espere o projeto ficar pronto (~2 min).
4. No menu **Settings → API**, copie e guarde 3 coisas:
   - **Project URL** (algo como `https://xxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (secreta!)
5. Em **Settings → Database**, na seção **Connection string**, clique em **Session pooler**
   (⚠️ **NÃO** use a "Direct connection") e copie a URL no modo **URI**.

> **Por que Session pooler, e não a conexão direta?** A conexão "direct" do Supabase é
> **só IPv6**, e a instalação pode travar tentando usá-la. O **Session pooler** aceita IPv4 e é
> **grátis** (você **não** precisa do add-on pago "IPv4 dedicado"). A URL correta se parece com:
> `postgresql://postgres.SEUPROJETO:SUASENHA@aws-1-<região>.pooler.supabase.com:5432/postgres`

Pronto — você tem as 4 informações do banco.

---

## Passo 4 — Aponte seu domínio para o servidor

> ⏳ **Faça este passo cedo, de preferência 1 dia antes.** O domínio leva de minutos a horas
> pra "propagar", e o SSL só é emitido depois que ele apontar pra cá.

Crie um registro **A** no painel onde está o seu domínio. Se ele é da Hostinger:
**Domínios → (seu domínio) → DNS / Nameservers → Adicionar registro**.

| Campo | Valor |
|---|---|
| Tipo | A |
| Nome/Host | `crm` (ou `@` pra usar o domínio raiz) |
| Aponta para | o **IP do servidor** (passo 1) |

Isso faz `crm.seudominio.com.br` levar ao seu servidor. O instalador confere se já propagou e
te avisa.

> Usa Cloudflare? Deixe a nuvem **cinza** (sem proxy) até o cadeado aparecer.

---

## Passo 5 — Instale o CRM

> **Por que o comando baixa do repositório `melgarafael/DeskcommCRM`?** É o projeto original,
> onde o CRM é mantido. Instalando de lá, o seu CRM recebe **todas as versões novas** pelo botão
> "Atualizar agora" — sem depender de mim nem desta página.

Escolha um dos dois caminhos:

### Caminho fácil: o Claude Code faz por você

1. Conecte no servidor por SSH e **abra o Claude Code lá dentro** (na VPS, não no seu PC).
2. Escreva pra ele exatamente isto:

   > *"Clone https://github.com/melgarafael/DeskcommCRM e me instale o DeskcommCRM nesta VPS
   > da Hostinger seguindo o `hostgator-setup-kit/install.sh`. Me pergunte as chaves uma por
   > uma e resolva os erros você mesmo."*

3. Ele **baixa o projeto sozinho**, lê as instruções de instalação e conduz tudo — pedindo o
   domínio, as chaves do Supabase e da IA, e o e-mail/senha do admin **uma de cada vez**.

### Caminho manual: um comando

No servidor, baixe o projeto e rode o instalador:

```bash
git clone https://github.com/melgarafael/DeskcommCRM.git
cd DeskcommCRM
bash hostgator-setup-kit/install.sh
```

O instalador pergunta o que precisa e monta tudo: instala o Docker se faltar, gera as senhas
técnicas, cria o banco, cria o seu usuário admin, sobe o CRM com HTTPS e confere se ficou no ar.

### A pergunta do proxy (só em algumas VPS)

Se a sua VPS veio de um template com aplicativo (n8n, Coolify…), ela já tem um **Traefik**
ocupando as portas do site. O instalador detecta isso e, na Hostinger, mostra uma mensagem
assim:

```
⚠ As portas 80/443 estão ocupadas, mas NENHUM contêiner as publica.
  O único Traefik em modo host aqui é 'traefik'.
  ...
  É o 'traefik' que atende o seu site? (s/N)
```

Se você **não instalou nenhum outro servidor web na mão** (nginx, apache), é o Traefik da
Hostinger: responda **`s`**. O CRM passa a sair por ele, sem derrubar o que já roda na VPS.

Não tem certeza? Responda `N` — o instalador para sem mudar nada e mostra como conferir.

> Escolheu "Ubuntu 24.04" puro no Passo 1? Essa pergunta não aparece.

---

## Passo 6 — Primeiro acesso

1. Abra **`https://crm.seudominio.com.br`** no navegador. O **cadeado de segurança** (SSL) leva
   cerca de 1 minuto pra aparecer no primeiro acesso — se der erro de segurança, espere um pouco
   e recarregue.
2. Entre com o **e-mail e senha** que você definiu na instalação.
3. **Pronto — você já está dentro.**

> **Segurança em 2 etapas (opcional, e recomendada).** O CRM **não** pede isso no primeiro login
> — você liga quando quiser, em **Configurações › Segurança**, com um app como **Google
> Authenticator** ou **Authy**.

---

## Passo 7 — Conecte o WhatsApp

No onboarding, o CRM mostra um **QR code**. No celular:

1. Abra o WhatsApp → **Aparelhos conectados** → **Conectar um aparelho**.
2. Aponte a câmera pro QR na tela.

Pronto — as mensagens do seu número começam a cair no CRM.

> Recomendamos um número dedicado ao atendimento (não o seu pessoal).

---

## Passo 8 — Coloque a IA pra trabalhar (opcional)

Se você pulou a chave da IA na instalação, cadastre em **IA › Credenciais**. Depois, na área de
**Agentes de IA**, configure o robô (nome, tom de voz, base de conhecimento).

---

## Deu tudo certo? Cuide do seu CRM

| Quero... | Comando (no servidor, dentro da pasta `DeskcommCRM`) |
|---|---|
| Atualizar pra versão nova | pela tela: menu → rodapé → **"Nova versão"** · ou `bash hostgator-setup-kit/update.sh` |
| Ver se está tudo no ar | `bash hostgator-setup-kit/healthcheck.sh` |
| Fazer backup (faça sempre!) | `bash hostgator-setup-kit/backup.sh` |
| Esqueci a senha | `bash hostgator-setup-kit/reset-password.sh seu@email.com` |
| Perdi o app do autenticador | `bash hostgator-setup-kit/reset-mfa.sh seu@email.com` |

> **Backup é sério:** o plano grátis do Supabase **não faz backup sozinho**. Rode o `backup.sh`
> de vez em quando (ou agende no servidor pra rodar todo dia). Os snapshots da VPS no painel da
> Hostinger ajudam, mas não substituem o backup do banco, que mora no Supabase.

---

## Travou? Problemas comuns

| Sintoma | O que fazer |
|---|---|
| Site não abre / erro de segurança | O domínio ainda não apontou pro servidor, ou faltou liberar as portas. Rode `ufw allow 22,80,443/tcp`, confira o firewall do painel da Hostinger e espere o domínio propagar. |
| O instalador parou falando de portas 80/443 ocupadas | É o proxy da Hostinger — veja [a pergunta do proxy](#a-pergunta-do-proxy-só-em-algumas-vps). |
| A página fica recarregando/erro | Faltou alguma chave. Rode `docker compose -f docker-compose.prod.yml logs app` e procure a linha que diz qual variável falta. |
| WhatsApp não conecta | Veja `docker compose -f docker-compose.prod.yml logs waha`. Confirme que o número não está conectado em outro computador. |

Em qualquer travamento, você pode voltar ao **Claude Code** e pedir ajuda — ele lê os erros do
servidor e resolve.

---

*Guia da edição Hostinger por Thalena Lima. O DeskcommCRM é um projeto open source (MIT) de
[melgarafael/DeskcommCRM](https://github.com/melgarafael/DeskcommCRM).*
