import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export default function ConversationDetail() {
  const id = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : null;
  const [conv, setConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [token, setToken] = useState(null);
  const socketRef = useState({ current: null })[0];

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('lycan_token') : null;
    setToken(t);
    if (t) {
      loadConv(t);
      const s = io('http://localhost:4000/lycan', { auth: { token: t } });
      socketRef.current = s;
      s.on('message', (m) => setMessages((prev) => [...prev, m]));
      s.emit('join_conversation', { conversationId: id });
    }
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const loadConv = async (t) => {
    const res = await fetch(`http://localhost:4000/api/conversations/${id}`, { headers: { Authorization: `Bearer ${t}` } });
    const data = await res.json();
    setConv(data);
    setMessages(data.messages || []);
  };

  const send = () => {
    if (!socketRef.current || !input) return;
    socketRef.current.emit('send_message', { conversationId: id, body: input, senderType: 'agent' });
    setInput('');
  };

  if (!token) return <div style={{ padding: 20 }}>Please <a href="/login">login</a>.</div>;
  if (!conv) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>{conv.title || conv.id}</h2>
      <div style={{ border: '1px solid #ddd', padding: 12, height: 300, overflowY: 'auto' }}>
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 8 }}>
            <strong>{m.senderType}</strong>: {m.body} <br />
            <small>{new Date(m.createdAt).toLocaleTimeString()}</small>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12 }}>
        <input style={{ width: '60%' }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="message" />
        <button onClick={send} style={{ marginLeft: 8 }}>Send</button>
      </div>
    </div>
  );
}
