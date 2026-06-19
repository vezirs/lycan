import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [convId, setConvId] = useState('test-conv');
  const [input, setInput] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io('http://localhost:4000/lycan');
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('connected', socket.id);
    });

    socket.on('message', (msg) => {
      setMessages((m) => [...m, msg]);
    });

    socket.on('joined', (p) => {
      console.log('joined', p);
    });

    socket.on('disconnect', () => setConnected(false));

    return () => socket.disconnect();
  }, []);

  const join = () => {
    const s = socketRef.current;
    if (!s) return;
    s.emit('join_conversation', { conversationId: convId });
  };

  const send = () => {
    const s = socketRef.current;
    if (!s || !input) return;
    s.emit('send_message', { conversationId: convId, body: input, senderType: 'agent' });
    setInput('');
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <h1>Lycan Agent (dev)</h1>
      <p>Socket status: {connected ? 'connected' : 'disconnected'}</p>
      <div style={{ marginBottom: 12 }}>
        <input value={convId} onChange={(e) => setConvId(e.target.value)} placeholder="conversation id" />
        <button onClick={join} style={{ marginLeft: 8 }}>Join</button>
      </div>

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
