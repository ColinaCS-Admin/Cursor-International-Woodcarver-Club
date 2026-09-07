# International Woodcarver Club

Membership database described in `Project.docx`: React frontend, PostgreSQL backend, REST APIs.

## Local development

1. Start PostgreSQL:

```bash
docker compose up postgres -d
```

2. Install and run:

```bash
cp .env.example .env
npm run install:all
npm run seed --prefix backend
npm run dev --prefix backend
npm run dev --prefix frontend
```

Open http://localhost:5173

Demo accounts:

- Admin: `clubadmin` / `CarvingAdmin1!`
- Member: `oakcarver` / `CarvingMember1!`

## Full stack with Docker

```bash
docker compose up --build
```

Open http://localhost:8080

The same Compose file can be deployed to AWS (ECS/App Runner + RDS), Azure (Container Apps + Azure Database for PostgreSQL), or Google Cloud (Cloud Run + Cloud SQL).
