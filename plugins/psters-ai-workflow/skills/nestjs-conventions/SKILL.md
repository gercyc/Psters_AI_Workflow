---
name: nestjs-conventions
description: "Backend conventions for NestJS projects: modules, controllers, services, DTOs, migrations, structure. Use when implementing or reviewing code in NestJS backends."
---

# NestJS Conventions

When working in `backend/` (or NestJS app root), follow these conventions:

- **Structure**: Feature-based modules. Each feature: `*.module.ts`, `*.controller.ts`, `*.service.ts`, entities, `dto/`. No business logic in controllers.
- **DTOs**: Always use DTOs with class-validator; separate create/update/response. User-facing messages in English.
- **Migrations**: Never create migration files manually. Use TypeORM CLI: `npm run typeorm:generate -- src/database/migrations/DescriptiveName`. Entities drive schema.
- **Guards/Interceptors**: Use common guards and interceptors; constructor injection.
- **Config**: @nestjs/config; typed config; no hardcoded secrets.
- **Errors**: NestJS exception filters; consistent error format; English messages.
- **IAC**: Do not run CDK deploy from backend work unless project-specific; use AWS CLI for actual AWS changes.

Reference project rules and structure docs for full details.
