# Iteration 3 - Auth, Seed & Socket Security

This iteration adds authentication (JWT), a seed script to populate a demo admin and widget, and client updates so the Agent app can authenticate and connect to Socket.io with a token.

What I added on branch feat/auth-seed

- apps/api/prisma/seed.js: seed script creating an admin user, demo widget and conversation with messages.
- Updated apps/api/package.json: added scripts prisma:seed and dependencies (bcryptjs, jsonwebtoken).
- Updated apps/agent pages:
  - /login page to authenticate against /api/auth/login
  - index page now reads token from localStorage and connects to /lycan with the token

How to run the seed locally

1. Ensure you have DATABASE_URL and JWT_SECRET in your .env
2. From repo root:
   pnpm install
3. From apps/api:
   pnpm --filter apps/api exec prisma generate
   pnpm --filter apps/api exec prisma migrate dev --name init
   pnpm --filter apps/api run prisma:seed

Default seed credentials
- admin@local.test / changeme123
- Demo widget id: 00000000-0000-0000-0000-000000000001
- Demo conversation created during seed (check DB)

Next steps I propose
1. Harden the widget script for production (minify, CDN, signed tokens for admin actions).
2. Implement full Dashboard UI for customizing widget settings and generating widget UUID/token.
3. Add message attachments, typing indicators, agent presence.
4. Add Redis adapter for Socket.io in production and configure deployments.
5. Add CI/CD (GitHub Actions), tests, and monitoring.

If you want, I can open a PR from feat/auth-seed → main now, or merge directly. I can also continue implementing the Dashboard and widget production steps next — tell me to proceed and I will push the next iteration.
