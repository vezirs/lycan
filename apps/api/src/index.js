import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_in_prod';

// Auth helpers
function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'no_token' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'invalid_token' });
  try {
    const payload = jwt.verify(parts[1], JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'missing_fields' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { email, password: hashed, name, role: 'owner' } });
    const token = signToken(user);
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'missing_fields' });
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'invalid_credentials' });
    const ok = await bcrypt.compare(password, user.password || '');
    if (!ok) return res.status(401).json({ error: 'invalid_credentials' });
    const token = signToken(user);
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// Me
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user) return res.status(404).json({ error: 'not_found' });
    return res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (err) {
    console.error('me error', err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// health
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Widgets
app.get('/api/widgets/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const widget = await prisma.widget.findUnique({ where: { id } });
    if (!widget) return res.status(404).json({ error: 'Widget not found' });
    return res.json({ id: widget.id, settings: widget.settings });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal_error' });
  }
});

// widget-host
app.get('/widget-host', (req, res) => {
  const widgetId = req.query.widgetId || 'unknown';
  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>Lycan Widget Host</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;padding:12px}#btn{background:#4F46E5;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer}</style>
    </head>
    <body>
      <div>
        <h3>Lycan Widget (widgetId: ${widgetId})</h3>
        <p>This is a demo widget host page (inside an iframe).</p>
        <button id="btn">Send message to parent</button>
      </div>
      <script>
        const btn = document.getElementById('btn');
        btn.addEventListener('click', () => {
          const payload = { type: 'lycan.widget.event', event: 'open_chat', widgetId: '${widgetId}', ts: Date.now() };
          // Post message to parent
          window.parent.postMessage(payload, '*');
        });

        // Optionally listen to messages from parent
        window.addEventListener('message', (ev) => {
          try {
            const data = ev.data;
            if (data && data.type === 'lycan.parent.event') {
              console.log('Received from parent', data);
              alert('Parent says: ' + (data.message || ''));
            }
          } catch (e) { }
        });
      </script>
    </body>
  </html>`;
  res.set('Content-Type', 'text/html');
  res.send(html);
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, methods: ['GET', 'POST'] },
});

// Redis adapter optional
if (process.env.REDIS_URL) {
  try {
    // lazy import
    const { createAdapter } = await import('socket.io-redis');
    const adapter = createAdapter({ url: process.env.REDIS_URL });
    io.adapter(adapter);
    console.log('Redis adapter enabled for Socket.io');
  } catch (e) {
    console.warn('Failed to enable Redis adapter, continuing without it', e);
  }
}

const lycan = io.of('/lycan');

// middleware for Socket.io auth
lycan.use(async (socket, next) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  if (!token) return next(); // allow anonymous for visitor sockets
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    socket.data.user = payload;
    return next();
  } catch (err) {
    console.warn('Invalid socket token', err);
    return next(new Error('invalid_token'));
  }
});

lycan.on('connection', (socket) => {
  console.log('Socket connected', socket.id, 'user:', socket.data.user ? socket.data.user.email : 'visitor');

  socket.on('join_conversation', (payload) => {
    const { conversationId } = payload || {};
    if (conversationId) {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined room ${conversationId}`);
      socket.emit('joined', { conversationId });
    }
  });

  socket.on('send_message', async (payload) => {
    try {
      const { conversationId, senderType = 'visitor', senderId = null, body } = payload || {};
      if (!conversationId || !body) {
        socket.emit('error', { message: 'conversationId and body required' });
        return;
      }

      // If senderType is 'agent', ensure socket is authenticated
      if (senderType === 'agent') {
        if (!socket.data.user) {
          socket.emit('error', { message: 'unauthenticated' });
          return;
        }
      }

      const message = await prisma.message.create({
        data: {
          conversationId,
          senderType,
          senderId: socket.data.user ? socket.data.user.sub : senderId,
          body,
        },
      });

      lycan.to(conversationId).emit('message', message);
    } catch (err) {
      console.error('send_message error', err);
      socket.emit('error', { message: 'internal_error' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Lycan API+Socket running on http://localhost:${PORT}`);
});
