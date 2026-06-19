import { useEffect, useState } from 'react';

function fetcher(url, token) {
  return fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' },
  }).then((r) => r.json());
}

export default function WidgetsPage() {
  const [widgets, setWidgets] = useState([]);
  const [name, setName] = useState('');
  const [settings, setSettings] = useState('{}');
  const [token, setToken] = useState(null);

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('lycan_token') : null;
    setToken(t);
    if (t) loadWidgets(t);
  }, []);

  const loadWidgets = async (t) => {
    const data = await fetcher('http://localhost:4000/api/widgets', t);
    setWidgets(data || []);
  };

  const create = async () => {
    try {
      const payload = { name, settings: JSON.parse(settings || '{}') };
      const res = await fetch('http://localhost:4000/api/widgets', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      setName('');
      setSettings('{}');
      loadWidgets(token);
    } catch (e) {
      alert('Create failed: ' + e.message);
    }
  };

  const del = async (id) => {
    if (!confirm('Delete widget?')) return;
    await fetch(`http://localhost:4000/api/widgets/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    loadWidgets(token);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Widgets</h2>
      {!token && <p>Please <a href="/login">login</a> to manage widgets.</p>}

      {token && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <input placeholder="Widget name" value={name} onChange={(e) => setName(e.target.value)} />
            <input placeholder='Settings JSON' style={{ width: 400, marginLeft: 8 }} value={settings} onChange={(e) => setSettings(e.target.value)} />
            <button onClick={create} style={{ marginLeft: 8 }}>Create</button>
          </div>

          <ul>
            {widgets.map((w) => (
              <li key={w.id} style={{ marginBottom: 8 }}>
                <strong>{w.name}</strong> — <a href={`/dashboard/widgets/${w.id}`}>Manage</a> — <button onClick={() => del(w.id)} style={{ marginLeft: 8 }}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
