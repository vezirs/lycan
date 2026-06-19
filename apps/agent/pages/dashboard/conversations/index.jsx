import { useEffect, useState } from 'react';

export default function Conversations() {
  const [convs, setConvs] = useState([]);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('lycan_token') : null;
    setToken(t);
    if (t) load(t);
  }, []);

  const load = async (t) => {
    const res = await fetch('http://localhost:4000/api/conversations', { headers: { Authorization: `Bearer ${t}` } });
    const data = await res.json();
    setConvs(data || []);
  };

  if (!token) return <div style={{ padding: 20 }}>Please <a href="/login">login</a>.</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Conversations</h2>
      <ul>
        {convs.map((c) => (
          <li key={c.id}>
            <a href={`/dashboard/conversations/${c.id}`}>{c.title || c.id}</a> — status: {c.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
