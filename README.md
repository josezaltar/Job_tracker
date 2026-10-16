# 🎯 Job Tracker Pro

Sistema completo de gerenciamento de candidaturas de emprego, construído com React, TypeScript, Node.js e Express.

![Dashboard Preview](https://img.shields.io/badge/Status-Em%20Desenvolvimento-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)

## 📋 Sobre o Projeto

O **Job Tracker Pro** é uma aplicação fullstack que ajuda profissionais a organizarem suas candidaturas de emprego. Com ele, você pode acompanhar o status de cada vaga, visualizar métricas do seu pipeline e nunca mais perder o controle das suas aplicações.

### ✨ Funcionalidades

- 🔐 **Autenticação completa** — Registro, login e logout com JWT
- 📝 **CRUD de vagas** — Criar, editar, visualizar e excluir candidaturas
- 📊 **Dashboard interativo** — Métricas em tempo real e pipeline visual
- 🔍 **Filtros e busca** — Encontre vagas por empresa, cargo ou status
- 🏷️ **Status personalizados** — Wishlist, Aplicado, Entrevista, Proposta, Aceito, Rejeitado
- 💾 **Persistência de dados** — Seus dados salvos no backend
- 🛡️ **Rotas protegidas** — Acesso apenas para usuários autenticados

## 🛠️ Tecnologias

### Frontend
- **React 18** — Biblioteca UI
- **TypeScript** — Tipagem estática
- **Vite** — Build tool ultrarrápido
- **Tailwind CSS** — Estilização utility-first
- **Redux Toolkit** — Gerenciamento de estado
- **RTK Query** — Data fetching e cache
- **React Router v6** — Roteamento SPA

### Backend
- **Node.js** — Runtime JavaScript
- **Express** — Framework web
- **TypeScript** — Tipagem estática
- **JWT** — Autenticação stateless
- **bcryptjs** — Hash de senhas
- **CORS** — Cross-Origin Resource Sharing

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

### 1. Clone o repositório

```bash
git clone https://github.com/josezaltar/Job_tracker.git
cd Job_tracker
```

### 2. Configure o Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

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
│   │   ├── data/           # Banco de dados JSON
│   │   ├── types/          # Tipos TypeScript
│   │   └── server.ts       # Entrada da aplicação
│   └── ...
│
└── README.md
```

## 🔌 API Endpoints

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Criar nova conta |
| POST | `/api/auth/login` | Fazer login |
| GET | `/api/auth/me` | Dados do usuário logado |

### Vagas (requer autenticação)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/jobs` | Listar todas as vagas |
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

- [ ] Migrar para PostgreSQL com Prisma
- [ ] Deploy (Vercel + Render)
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
