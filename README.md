# Taurus Gym Monorepo (NestJS)

Monorepo NestJS con tres microservicios y una librería compartida:

- `apps/auth-service` (2 capas: API + infraestructura)
- `apps/members-service` (hexagonal: API + application + infraestructura)
- `apps/access-service` (hexagonal: API + application + infraestructura)
- `libs/common` (guards, decorators, payload JWT y DTO base)

## Scripts

```bash
npm run build
npm run build:auth
npm run build:members
npm run build:access
npm run start:dev:auth
npm run start:dev:members
npm run start:dev:access
npm run docker:up
npm run docker:down
```

## Infraestructura

- `docker-compose.yml`: PostgreSQL 16, MongoDB 7, Redis 7 (AOF), Mosquitto 2, Nginx y los 3 servicios.
- `nginx.conf`: rutas por prefijo:
    - `/api/auth/* -> auth-service:3000`
    - `/api/members/* -> members-service:3001`
    - `/api/access/* -> access-service:3002`
- `init.sql`: crea schemas `auth` y `members` + datos semilla.
- `init-mongo.js`: crea `taurus_access` (`access_logs`, `audit_trail`) + datos semilla.

Usa `.env.example` como plantilla para variables de entorno.
