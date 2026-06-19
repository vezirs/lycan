import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('admin@local.test');
  const [password, setPassword] = useState('changeme123');
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('lycan_token', data.token);
      // redirect to home
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <h1>Agent Login</h1>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 8 }}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email" />
        </div>
        <div style={{ marginBottom: 8 }}>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" />
        </div>
        <div>
          <button type="submit">Login</button>
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
}
