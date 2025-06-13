import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

const Auth = ({ onAuth }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const endpoint = mode === 'login' ? '/login' : '/register';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        if (mode === 'login') {
          localStorage.setItem('jwt', data.access_token);
          localStorage.setItem('user', JSON.stringify(data.user));
          onAuth(data.user);
        } else {
          setMode('login');
          setError('Registration successful! Please log in.');
        }
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 350, margin: '4rem auto', padding: 24, border: '1px solid #ccc', borderRadius: 8 }}>
      <h2 style={{ textAlign: 'center' }}>{mode === 'login' ? 'Login' : 'Register'}</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: 8, fontSize: 16 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8, fontSize: 16 }}
          />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <button type="submit" style={{ width: '100%', padding: 10, fontSize: 16 }} disabled={loading}>
          {loading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Register')}
        </button>
      </form>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        {mode === 'login' ? (
          <span>Don&apos;t have an account? <button onClick={() => setMode('register')} style={{ border: 'none', background: 'none', color: '#1976d2', cursor: 'pointer' }}>Register</button></span>
        ) : (
          <span>Already have an account? <button onClick={() => setMode('login')} style={{ border: 'none', background: 'none', color: '#1976d2', cursor: 'pointer' }}>Login</button></span>
        )}
      </div>
    </div>
  );
};

export default Auth; 