import { useEffect, useState } from 'react';

export default function WidgetManage({ params }) {
  const widgetId = typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : null;
  const [widget, setWidget] = useState(null);
  const [token, setToken] = useState(null);
  const [settingsText, setSettingsText] = useState('{}');

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('lycan_token') : null;
    setToken(t);
    if (t) loadWidget(t);
  }, []);

  const loadWidget = async (t) => {
    const res = await fetch('http://localhost:4000/api/widgets', { headers: { Authorization: `Bearer ${t}` } });
    const list = await res.json();
    const w = list.find((x) => x.id === widgetId);
    setWidget(w);
    if (w) setSettingsText(JSON.stringify(w.settings || {}, null, 2));
  };

  const save = async () => {
    try {
      const updated = { name: widget.name, settings: JSON.parse(settingsText || '{}') };
      const res = await fetch(`http://localhost:4000/api/widgets/${widgetId}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(updated) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      alert('Saved');
    } catch (e) {
      alert('Save failed: ' + e.message);
    }
  };

  const genToken = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/widgets/${widgetId}/generate-token`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'failed');
      alert('Token: ' + data.token);
    } catch (e) {
      alert('Generate token failed: ' + e.message);
    }
  };

  if (!token) return <div style={{ padding: 20 }}>Please <a href="/login">login</a>.</div>;
  if (!widget) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Manage widget: {widget.name}</h2>
      <div>
        <label>Name</label>
        <input value={widget.name} onChange={(e) => setWidget({ ...widget, name: e.target.value })} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label>Settings (JSON)</label>
        <br />
        <textarea rows={10} cols={80} value={settingsText} onChange={(e) => setSettingsText(e.target.value)} />
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={save}>Save</button>
        <button onClick={genToken} style={{ marginLeft: 8 }}>Generate Token</button>
      </div>
    </div>
  );
}
