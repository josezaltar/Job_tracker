# Analisador de Vagas: extensão para Edge e Chrome

Extensão do **Job Tracker Pro** que lê a vaga aberta no navegador e usa IA (Groq) para dizer a chance real de ser chamado. Com um clique, salva a vaga no Job Tracker com a análise nas observações.

## O que ela faz

- Lê o texto selecionado na página. Se nada estiver selecionado, lê o conteúdo principal da página. Funciona no LinkedIn, Gupy, Programathor, Indeed e outros sites.
- Dá uma nota de 0 a 100 e a chance (ALTA, MÉDIA ou BAIXA).
- Mostra o que bate com o seu perfil, o que falta, os requisitos eliminatórios e qual versão do currículo enviar.
- Salva a vaga no Job Tracker: empresa, cargo, local, salário, link, descrição e análise. O status fica como "Quero aplicar" ou "Já apliquei" (com a data de hoje).

## Stack

React 19, TypeScript, Vite e Tailwind CSS, com Manifest V3. As chamadas à Groq e à API do Job Tracker partem da própria extensão. A chave e o token ficam no `chrome.storage.local`, e a senha nunca é salva.

## Instalação

```bash
cd extension
npm install
npm run build   # gera a pasta dist/
npm test        # testes da análise e do envio
```

**No Edge:** abra `edge://extensions`, ligue o **Modo de desenvolvedor** e clique em **Carregar sem compactação**. Escolha a pasta `dist`.
**No Chrome:** o caminho é o mesmo, em `chrome://extensions`.

## Configuração

Abra as **Opções** pelo ícone de engrenagem no popup e preencha:

1. **Chave da Groq.** Crie uma de graça em [console.groq.com/keys](https://console.groq.com/keys). O modelo padrão é `openai/gpt-oss-120b`.
2. **Perfil.** É o texto que a IA compara com cada vaga.
3. **Conta do Job Tracker.** Entre com o seu e-mail e senha. A API em produção acorda em até 1 minuto (plano gratuito do Render).

Atalho para abrir a extensão: `Ctrl+Shift+Y`.
