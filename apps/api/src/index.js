import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Simple endpoint to fetch widget settings by id
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

// Simple widget host page (served inside the iframe)
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
  // CORS for local dev; tighten in production
  cors: { origin: true, methods: ['GET', 'POST'] },
});

const lycan = io.of('/lycan');

lycan.on('connection', (socket) => {
  console.log('Socket connected', socket.id);

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
      const { conversationId, senderType = 'agent', senderId = null, body } = payload || {};
      if (!conversationId || !body) {
        socket.emit('error', { message: 'conversationId and body required' });
        return;
      }

      // Persist message (basic)
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderType,
          senderId,
          body,
        },
      });

      // Emit to room
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
