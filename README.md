Lycan - Live Chat SaaS

This repository is a monorepo scaffold for the Lycan live chat SaaS.

Structure
- apps/landing: Next.js landing site
- apps/agent: Next.js agent dashboard (real-time)
- apps/api: Node.js API + Socket.io server
- packages/widget: Vanilla JS snippet + iframe host for the embedded widget
- packages/ui: Shared React components (UI primitives)

Getting started (local)
1. Install pnpm (https://pnpm.io/installation)
2. pnpm install
3. Configure .env files (see .env.example)
4. Start a workspace, e.g. pnpm --filter apps/api dev

Database
- Prisma is used as ORM. See prisma/schema.prisma
- Run migrations with: pnpm --filter apps/api exec prisma migrate dev

I will iteratively add more code: TypeScript config, ESLint, Tailwind, and initial implementations (API, Socket.io, widget skeleton).
