# 🎯 Job Tracker Pro

Sistema completo de gerenciamento de candidaturas de emprego, construído com React, TypeScript, Node.js, Express e PostgreSQL.

**🔗 Acesse a demo:** _link após o deploy_ — clique em **"Entrar com conta demo"** para explorar sem se cadastrar.

![Status](https://img.shields.io/badge/Status-Em%20produ%C3%A7%C3%A3o-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)

## 📋 Sobre o Projeto

O **Job Tracker Pro** é uma aplicação fullstack que ajuda profissionais a organizarem suas candidaturas de emprego. Com ele, você pode acompanhar o status de cada vaga, visualizar métricas do seu pipeline e nunca mais perder o controle das suas aplicações.

### ✨ Funcionalidades

- 🔐 **Autenticação completa** — Registro, login e logout com JWT
- 📝 **CRUD de vagas** — Criar, editar, visualizar e excluir candidaturas
- 📊 **Dashboard interativo** — Métricas em tempo real e pipeline visual
- 🔍 **Filtros e busca** — Encontre vagas por empresa, cargo ou status
- 🏷️ **Status personalizados** — Wishlist, Aplicado, Entrevista, Proposta, Aceito, Rejeitado
- 💾 **Persistência de dados** — PostgreSQL com SQL puro (node-postgres)
- 👀 **Conta demo** — Acesso com dados de exemplo, recriados a cada reinício do servidor
- 🛡️ **Rotas protegidas** — Acesso apenas para usuários autenticados
- 🧩 **Extensão para Edge/Chrome** — Analisa a vaga aberta com IA (nota, o que bate, o que falta) e salva no Job Tracker com um clique. Veja [`extension/`](extension/README.md)

## 🛠️ Tecnologias

### Frontend
- **React 19** — Biblioteca UI
- **TypeScript** — Tipagem estática
- **Vite** — Build tool ultrarrápido
- **Tailwind CSS** — Estilização utility-first
- **Redux Toolkit** — Gerenciamento de estado
- **RTK Query** — Data fetching e cache
- **React Router v7** — Roteamento SPA

### Backend
- **Node.js** — Runtime JavaScript
- **Express** — Framework web
- **TypeScript** — Tipagem estática
- **PostgreSQL + node-postgres (pg)** — Banco relacional com queries parametrizadas
- **JWT** — Autenticação stateless
- **bcryptjs** — Hash de senhas
- **CORS** — Cross-Origin Resource Sharing

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL rodando localmente (ou um banco gratuito no [Neon](https://neon.tech))

### 1. Clone o repositório

```bash
git clone https://github.com/josezaltar/Job_tracker.git
cd Job_tracker
```

### 2. Configure o Backend

```bash
cd backend
npm install
cp .env.example .env   # preencha DATABASE_URL e JWT_SECRET
npm run dev
```

As tabelas são criadas automaticamente na primeira execução, junto com a conta demo.

O servidor estará rodando em `http://localhost:3001`

### 3. Configure o Frontend

```bash
cd frontend
npm install
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## 📁 Estrutura do Projeto

```
Job_tracker/
├── frontend/
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── layouts/        # Layouts (sidebar, etc)
│   │   ├── store/          # Redux store e slices
│   │   ├── services/       # RTK Query APIs
│   │   ├── hooks/          # Custom hooks
│   │   ├── types/          # Tipos TypeScript
│   │   ├── routes/         # Configuração de rotas
│   │   └── utils/          # Funções utilitárias
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── controllers/    # Lógica dos endpoints
│   │   ├── routes/         # Definição de rotas
│   │   ├── middleware/     # Middlewares (auth)
│   │   ├── config/         # Variáveis de ambiente
│   │   ├── db/             # Conexão, criação das tabelas e conta demo
│   │   ├── data/           # Queries SQL (repositório)
│   │   ├── types/          # Tipos TypeScript
│   │   └── server.ts       # Entrada da aplicação
│   └── ...
│
└── README.md
```

## ☁️ Deploy

| Parte | Serviço | Observação |
|-------|---------|------------|
| Banco | [Neon](https://neon.tech) | PostgreSQL gratuito |
| API | [Render](https://render.com) | Configurado em `render.yaml` (plano gratuito: a API "dorme" após 15 min sem uso e leva ~1 min para acordar) |
| Front-end | [Vercel](https://vercel.com) | Root directory `frontend`, variável `VITE_API_URL` |

## 🔌 API Endpoints

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Criar nova conta |
| POST | `/api/auth/login` | Fazer login |
| GET | `/api/auth/me` | Dados do usuário logado |
| POST | `/api/auth/extension-token` | Token de 90 dias para a extensão do navegador (requer autenticação) |

### Vagas (requer autenticação)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/jobs` | Listar todas as vagas (`?url=` filtra pelo link da vaga) |
| GET | `/api/jobs/:id` | Buscar vaga por ID |
| POST | `/api/jobs` | Criar nova vaga |
| PATCH | `/api/jobs/:id` | Atualizar vaga |
| DELETE | `/api/jobs/:id` | Excluir vaga |

### Exemplo de requisição autenticada

```bash
curl -X GET http://localhost:3001/api/jobs \
  -H "Authorization: Bearer <seu-token>"
```

## 📸 Screenshots

### Dashboard
- Métricas em tempo real (total de vagas, aplicadas, entrevistas, taxa de retorno)
- Pipeline visual com barras de progresso
- Atividade recente

### Página de Vagas
- Lista de vagas em cards
- Filtros por status
- Busca por empresa/cargo
- Ações rápidas (avançar status, editar, excluir)

### Login/Registro
- Formulários com validação
- Feedback de erros
- Loading states

## 🔮 Roadmap

- [x] Migrar para PostgreSQL
- [x] Deploy (Vercel + Render + Neon)
- [ ] Responsividade mobile
- [ ] Sistema de lembretes/notificações
- [ ] Importação de vagas do LinkedIn
- [ ] Histórico de interações por vaga
- [ ] Exportação de dados (CSV/PDF)
- [ ] Testes automatizados

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

1. Fork o projeto
2. Crie sua branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**José Zaltar**

- GitHub: [@josezaltar](https://github.com/josezaltar)
- LinkedIn: [José Zaltar](https://linkedin.com/in/josezaltar)

---

⭐ Se este projeto te ajudou, considere dar uma estrela no repositório!
