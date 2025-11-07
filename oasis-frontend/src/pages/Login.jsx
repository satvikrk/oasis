import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';

export default function Login(){
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function submit(e){
    e.preventDefault();
    setError('');
    try{
      const resp = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ username, password })
      });
      const data = await resp.json();
      if (!resp.ok) return setError(data.error || 'Login failed');
      localStorage.setItem('oasis_token', data.token);
      localStorage.setItem('oasis_user_id', data.user_id);
      localStorage.setItem('oasis_username', data.username);
    // store admin flag so the frontend can show admin UI immediately
    try{ localStorage.setItem('oasis_is_admin', data.is_admin ? '1' : '0'); }catch(e){}
  // notify app that a login occurred so navbar can update immediately
  try{ window.dispatchEvent(new CustomEvent('oasis_login', { detail: { user_id: data.user_id, username: data.username, is_admin: !!data.is_admin } })); }catch(e){}
  navigate('/playlists');
    }catch(err){ setError(String(err)); }
  }

  return (
    <div className="page-card" style={{maxWidth:420, margin:'40px auto'}}>
      <h2>Sign in</h2>
      <form onSubmit={submit} className="form-vertical">
        <label className="form-label">Username or Email</label>
        <input className="input" value={username} onChange={e=>setUsername(e.target.value)} required />

        <label className="form-label">Password</label>
        <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />

        <div style={{marginTop:12}}>
          <button className="btn-primary" type="submit">Sign in</button>
        </div>
        {error && <div className="error" style={{marginTop:8}}>{error}</div>}
      </form>
    </div>
  );
}
