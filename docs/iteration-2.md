## Iteration 2 - API, Socket.io, Agent & Widget embed

This iteration adds a minimal API server with Socket.io, a demo Agent UI, and a lightweight widget embed snippet for local development.

What was added on branch feat/api-widget

- apps/api/src/index.js
  - Express server (GET /health)
  - GET /api/widgets/:id endpoint (returns widget.settings from Prisma)
  - /widget-host iframe host HTML for demo
  - Socket.io namespace `/lycan` with handlers: join_conversation, send_message (persists Message via Prisma)

- apps/agent/pages/* : simple Next.js pages connecting to Socket.io to test join/send message flows

- packages/widget/src/embed.js : lightweight embed script to inject an iframe and listen to postMessage events

How to run locally

1. Install deps
   - pnpm install

2. Configure .env in project root (or apps/api) with DATABASE_URL pointing to Postgres.

3. Generate Prisma client & migrate
   - cd apps/api
   - pnpm exec prisma generate
   - pnpm exec prisma migrate dev --name init

4. Start API
   - pnpm --filter apps/api dev

5. Start Agent (in another terminal)
   - pnpm --filter apps/agent dev

6. Open http://localhost:3000 (Agent app)

Notes
- The widget embed defaults to API http://localhost:4000 in development. You can override by setting window.__LYCAN_API_URL__ before loading the script.
- This is a minimal dev scaffold for the realtime flow. In next iterations we'll add authentication (NextAuth), better error handling, Redis adapter for Socket.io, message ack/ordering, visitor sessions and more.
