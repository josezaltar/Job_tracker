# Job Tracker Pro - Backend

API REST para o Job Tracker Pro, construída com Node.js, Express e TypeScript.

## 🚀 Como rodar

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Rodar em desenvolvimento
npm run dev
```

O servidor vai rodar em `http://localhost:3001`

## 📋 Endpoints

### Autenticação

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/register` | Criar conta |
| POST | `/api/auth/login` | Fazer login |
| GET | `/api/auth/me` | Dados do usuário logado |

### Vagas (requer autenticação)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/jobs` | Listar vagas |
| GET | `/api/jobs/:id` | Buscar vaga |
| POST | `/api/jobs` | Criar vaga |
| PATCH | `/api/jobs/:id` | Atualizar vaga |
| DELETE | `/api/jobs/:id` | Deletar vaga |

## 🔐 Autenticação

Todas as rotas de vagas requerem o header:

```
Authorization: Bearer <token>
```

O token é retornado no login/registro.

## 📦 Estrutura

```
src/
├── controllers/    # Lógica dos endpoints
├── data/           # Banco de dados JSON
├── middleware/     # Middlewares (auth)
├── routes/         # Definição de rotas
├── types/          # Tipos TypeScript
└── server.ts       # Entrada da aplicação
```

## 🔄 Migração para PostgreSQL

Este projeto usa um banco JSON simples para desenvolvimento.
Para produção, recomenda-se migrar para PostgreSQL com Prisma:

1. Instalar Prisma: `npm install prisma @prisma/client`
2. Inicializar: `npx prisma init`
3. Definir schema e rodar migrations
