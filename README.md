# CRUD Students API (Node.js + Express 5 + Prisma + JWT)

API para gerenciar estudantes e suas notas, com autenticação JWT, banco SQLite (via Prisma) e rotas para estatísticas/relatórios.

-----

## Stack

  - **Node.js** 18+
  - **Express** 5.x
  - **Prisma** 5.x (SQLite)
  - **JWT** (jsonwebtoken)
  - **bcryptjs**
  - **dotenv**
  - **nodemon** (dev)

## Pré-requisitos

  - Node.js 18+ e npm
  - (Opcional) Postman para testes
  - (Opcional) Prisma Studio para inspecionar o DB

-----

## Instalação

```bash
# clonar o projeto
git clone <seu-repo>
cd crud-students

# instalar dependências
npm install
```

-----


## Banco de dados (Prisma)

Gerar o client (se necessário) e aplicar migrações:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Popular o banco com dados de exemplo (admin + alunos):

```bash
npm run seed
# Credenciais padrão do seed:
# email: admin@demo.com
# senha: 123456
```

Abrir o Prisma Studio (opcional):

```bash
npm run prisma:studio
```

-----

## Executando o projeto

```bash
# desenvolvimento (auto-reload)
npm run dev


O servidor sobe em `http://localhost:3000`.

-----

## Estrutura de pastas

```
├── .env
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.cjs
└── src/
    ├── app.js
    ├── routes.js
    ├── db/prisma.js
    ├── middlewares/auth.js
    └── controllers/
        ├── auth.controller.js
        └── students.controller.js
```

-----

## Modelos (conceito)

  - **User**
      - `id`, `name`, `email` (único), `passwordHash/password`
  - **Student**
      - `id`, `name`, `age`
  - **Grade**
      - `id`, `value` (0–10), `studentId` (N:1 Student, com cascade delete)

O seed cria `admin@demo.com` / `123456`, e 3 estudantes com notas.

-----

## Rotas da API

Todas as rotas de `Students` e `Stats` exigem token Bearer válido.

**Auth**

  - `POST /auth/register` → cria usuário
  - `POST /auth/login` → retorna `{ token }`
  - `GET /auth/me` → dados do usuário autenticado

**Students (CRUD)**

  - `GET /students` → lista paginada (`?page=1&size=50`)
  - `GET /students/search?q=...` → busca por nome
  - `POST /students` → cria estudante (body: `name`, `age`, `grades[]`)
  - `PUT /students/:id` → atualiza (parcial/total)
  - `DELETE /students/:id` → remove

**Stats / Relatórios**

  - `GET /students/stats/average` → `{ classAverage: number }`
  - `GET /students/stats/top` → estudante com maior média
  - `GET /students/reports` → buckets `{ aprovados, recuperacao, reprovados }`
  - `GET /students/reports?status=aprovados|recuperacao|reprovados` → apenas um bucket

-----

## Testes no Postman 

1.  Crie um Environment `crud-students`

      - `base_url`: `http://localhost:3000/api` (se não houver prefixo `/api`, use `http://localhost:3000`)
      - `token`: (vazio; será preenchido pelo login)
      - `studentId`: (cria, ficará vazio até o POST Students)

2.  Crie uma Collection `CRUD Students`

      - Na Collection → Authorization: **Bearer Token** com valor `{{token}}`.
      - Em cada request, mantenha **Inherit auth from parent**.

3.  Requests (todas as rotas)
    A) **Auth**

      - **Register**

          - `POST {{base_url}}/auth/register`
          - Body (JSON):

        <!-- end list -->

        ```json
        {
          "name": "Usuário Teste",
          "email": "user1@demo.com",
          "password": "123456"
        }
        ```

          - Resposta: `201`.

      - **Login (salva token)**

          - `POST {{base_url}}/auth/login`
          - Body (JSON):

        <!-- end list -->

        ```json
        {
          "email": "admin@demo.com",
          "password": "123456"
        }
        ```

          - Tests (aba `Tests` do Postman) – cole para salvar o token:

        <!-- end list -->

        ```javascript
        pm.test("status 200", () => pm.response.to.have.status(200));
        const json = pm.response.json();
        pm.expect(json.token, "token na resposta").to.be.a("string").and.not.empty;
        pm.environment.set("token", json.token);
        ```

      - **Me**

          - `GET {{base_url}}/auth/me`
          - Espera: dados do usuário.

    B) **Students (CRUD)** — todas com Bearer `{{token}}`

      - **List**

          - `GET {{base_url}}/students?page=1&size=50`
          - Espera: `{ items, page, size, total }`.

      - **Search**

          - `GET {{base_url}}/students/search?q=an`
          - Espera: `[]` de estudantes.

      - **Create (salva studentId)**

          - `POST {{base_url}}/students`
          - Body (JSON):

        <!-- end list -->

        ```json
        {
          "name": "Diego",
          "age": 21,
          "grades": [7.5, 8.0, 9.2]
        }
        ```

          - Tests:

        <!-- end list -->

        ```javascript
        pm.test("status 201", () => pm.response.to.have.status(201));
        const json = pm.response.json();
        pm.expect(json.id, "id retornado").to.exist;
        pm.environment.set("studentId", json.id);
        ```

      - **Update**

          - `PUT {{base_url}}/students/{{studentId}}`
          - Body (JSON):

        <!-- end list -->

        ```json
        {
          "name": "Diego Silva",
          "age": 22,
          "grades": [10, 9.5, 8.5]
        }
        ```

          - Espera: objeto do estudante atualizado.

      - **Delete**

          - `DELETE {{base_url}}/students/{{studentId}}`
          - Espera: `{ "removed": true }`.

    C) **Stats / Reports** — todas com Bearer `{{token}}`

      - **Class Average**

          - `GET {{base_url}}/students/stats/average`
          - Espera: `{ "classAverage": <número> }`.

      - **Top Student**

          - `GET {{base_url}}/students/stats/top`
          - Espera: um estudante (ou null se vazio).

      - **Reports (todos)**

          - `GET {{base_url}}/students/reports`
          - Espera:

        <!-- end list -->

        ```json
        {
          "aprovados": [],
          "recuperacao": [],
          "reprovados": []
        }
        ```

      - **Reports (por status)**

          - `GET {{base_url}}/students/reports?status=aprovados`
          - `GET {{base_url}}/students/reports?status=recuperacao`
          - `GET {{base_url}}/students/reports?status=reprovados`

-----

## Validações e erros comuns

  - **401 Unauthorized**: faltou/expirou token → rode Login novamente; confira `{{token}}`.
  - **400** em Create/Update:
      - `name` obrigatório na criação.
      - `age` número \> 0.
      - `grades` é array e cada item 0 a 10.
  - **404**:
      - estudante não encontrado (`/students/:id`).

-----

## Dicas 

  - **Express 5**: certifique-se de estar no Node 18+.
  - **Nodemon**: use `npm run dev` para hot-reload.
  - **Seed**: se quiser dados limpos, rode `npm run seed` novamente.
  - **Gravação do token no Postman**: confira o script em Auth / Login → Tests.


