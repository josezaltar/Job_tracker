# Analisador de Vagas: extensão para Edge e Chrome

Extensão do **Job Tracker Pro** que lê a vaga aberta no navegador e usa IA (Groq) para dizer a chance real de ser chamado. Com um clique, salva a vaga no Job Tracker com a análise nas observações.

## O que ela faz

- **Lê a vaga.** Usa o texto selecionado; sem seleção, procura o bloco da descrição (LinkedIn, Indeed, Glassdoor e outros) e, por último, o conteúdo principal da página. No LinkedIn, ignora a lista de outras vagas ao lado.
- **Analisa com IA.** Nota de 0 a 100, chance (ALTA, MÉDIA ou BAIXA), o que bate com o perfil, o que falta, requisitos eliminatórios, qual versão do currículo enviar e uma dica.
- **Salva no Job Tracker.** Empresa, cargo, local, salário, link, descrição e análise, com status "Quero aplicar" ou "Já apliquei" (com a data de hoje).
- **Não duplica.** O link da vaga é normalizado (ex.: `linkedin.com/jobs/search/?currentJobId=123` vira `linkedin.com/jobs/view/123/`) e a extensão consulta a API antes de criar.
- **Não perde trabalho.** A IA e o salvamento rodam no service worker: dá para fechar o popup no meio (ou clicar na página) e o resultado aparece ao abrir de novo.

## Como funciona

```
popup (React) ──mensagem──▶ service worker ──▶ Groq (análise)
     ▲                            │
     └── chrome.storage.local ◀───┴──▶ API do Job Tracker (POST /api/jobs)
```

- **Manifest V3**, React 19, TypeScript, Vite e Tailwind CSS.
- A leitura da página usa `chrome.scripting` com a permissão `activeTab`: a extensão só lê a aba quando você clica nela.
- A chave da Groq e o token do Job Tracker ficam no `chrome.storage.local`. A senha nunca é salva: o login é trocado por um token de 90 dias (`POST /api/auth/extension-token`).
- As chamadas saem do service worker com `host_permissions`, por isso não dependem do CORS da API.

## Instalação

Requer Node.js 22 ou mais novo.

```bash
cd extension
npm install
npm run build   # gera a pasta dist/
npm test        # 21 testes: leitura da vaga, links, análise, login e envio
```

**No Edge:** abra `edge://extensions`, ligue o **Modo de desenvolvedor** e clique em **Carregar descompactada** (em inglês, *Load unpacked*). Escolha a pasta `extension/dist`.
**No Chrome:** o caminho é o mesmo, em `chrome://extensions`.

Depois de mudar o código, rode `npm run build` de novo e clique em **Recarregar** no card da extensão.

## Configuração

Abra as **Opções** pelo link no popup e preencha:

1. **Chave da Groq.** Crie uma de graça em [console.groq.com/keys](https://console.groq.com/keys). O modelo padrão é `openai/gpt-oss-120b`; o botão "Salvar e testar" confere a chave e o modelo.
2. **Perfil.** É o texto que a IA compara com cada vaga. Troque os exemplos entre parênteses pelos seus dados.
3. **Conta do Job Tracker.** Entre com o seu e-mail e senha. A API em produção pode levar até 1 minuto para acordar (plano gratuito do Render).

Atalho para abrir a extensão: `Alt+Shift+J` (dá para trocar em `edge://extensions/shortcuts`).
