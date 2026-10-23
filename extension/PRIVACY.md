# Política de privacidade — Analisador de Vagas (Job Tracker Pro)

Última atualização: 23 de outubro de 2026

O Analisador de Vagas é uma extensão para Microsoft Edge e Google Chrome que compara uma vaga de emprego aberta no navegador com o perfil profissional da pessoa usuária, usando inteligência artificial. Esta política explica quais dados a extensão usa, para onde eles vão e como apagá-los. Ela segue a Lei Geral de Proteção de Dados (Lei 13.709/2018).

## Quais dados a extensão usa

| Dado | Quando | Para quê |
|---|---|---|
| Texto da página da vaga (ou o trecho selecionado) e o endereço da página | Só quando você clica em "Analisar vaga" | Gerar a análise de compatibilidade |
| Texto dos currículos em PDF que você envia nas Opções | Só quando você envia os arquivos | Montar o seu perfil profissional |
| Perfil profissional gerado | Ao salvar o perfil | Comparar com cada vaga |
| Chave de API da Groq informada por você | Ao salvar nas Opções | Autenticar as chamadas à IA |
| E-mail e senha do Job Tracker (opcional) | Só no momento de conectar a conta | Obter um token de acesso; a senha não é guardada |

A extensão só lê a página quando você clica nela (permissão `activeTab`). Ela não acompanha a sua navegação, não lê outras abas e não coleta dados em segundo plano.

## Para onde os dados vão

- **Groq (api.groq.com):** o texto da vaga, o perfil e, ao montar o perfil, o texto dos currículos são enviados à API da Groq, com a sua chave, só para gerar a análise ou o perfil. O tratamento desses dados pela Groq segue a política de privacidade dela.
- **API do Job Tracker Pro (job-tracker-api-q7tc.onrender.com):** só se você conectar a sua conta e clicar em "Salvar no Job Tracker". Nesse caso, a vaga (empresa, cargo, local, salário, link, descrição) e o resumo da análise são gravados na sua conta.

Nenhum dado é vendido, usado para publicidade ou compartilhado com terceiros além dos dois serviços acima.

## O que fica guardado no seu navegador

O perfil, a chave de API, o token do Job Tracker, as análises das vagas e o status de estudo ficam no armazenamento local da extensão (`chrome.storage.local`), só no seu navegador. Os arquivos PDF dos currículos não são guardados: só o texto do perfil gerado a partir deles.

## Como apagar os seus dados

- **Na extensão:** remova a extensão do navegador. Isso apaga tudo o que ela guardou. Também dá para apagar o perfil nas Opções ("Apagar perfil") e desconectar a conta do Job Tracker.
- **No Job Tracker:** exclua as vagas pelo próprio site ou peça a exclusão da conta pelo e-mail abaixo.

## Contato

Responsável: José Maria Zaltar — josezaltar@gmail.com
