import React, { useEffect, useState } from 'react';
import { API_BASE } from '../api';
import { Link } from 'react-router-dom';

export default function Playlists(){
  const [playlists, setPlaylists] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  async function load(){
    setError('');
    try{
      const resp = await fetch(`${API_BASE}/api/playlists`, { headers: {'Authorization': `Bearer ${localStorage.getItem('oasis_token')}`} });
      const data = await resp.json();
      if (!resp.ok) {
        // if not authenticated or other error, show message and empty list
        setPlaylists([]);
        setError(data && data.error ? data.error : 'Failed to load playlists');
        return;
      }
      setPlaylists(Array.isArray(data) ? data : []);
    }catch(err){
      setPlaylists([]);
      setError(String(err));
    }
  }

  useEffect(()=>{ load(); }, []);

  async function create(){
    if (!title) return;
    try{
      const resp = await fetch(`${API_BASE}/api/playlists`, { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${localStorage.getItem('oasis_token')}`}, body: JSON.stringify({ title }) });
      if (!resp.ok) {
        const d = await resp.json();
        setError(d.error || 'Failed to create playlist');
        return;
      }
      setTitle('');
      load();
    }catch(err){ setError(String(err)); }
  }

  return (
    <div className="page-card" style={{maxWidth:960, margin:'28px auto'}}>
      <div className="page-header">
        <h2>Your Playlists</h2>
        <p className="muted">Create and manage your playlists.</p>
      </div>

      {!localStorage.getItem('oasis_token') && (
        <div className="notice">You must <Link to="/login">sign in</Link> to view and create playlists.</div>
      )}

      <div className="form-row" style={{marginTop:12}}>
        <input className="input" placeholder="New playlist title" value={title} onChange={e=>setTitle(e.target.value)} />
        <button className="btn-primary" onClick={create}>Create</button>
      </div>

      {error && <div className="error" style={{marginTop:10}}>{error}</div>}

      <div className="playlist-grid" style={{marginTop:16}}>
        {playlists.length === 0 && !error && <div className="muted">No playlists yet.</div>}

        {playlists.map(p=> (
          <div key={p.playlist_id} className="playlist-card">
            <div className="playlist-title">{p.title}</div>
            <div className="playlist-meta muted">{(p.songs && p.songs.length) || 0} songs</div>
            <div className="playlist-songs">
              {p.songs?.map(s => <div key={s.song_id} className="song-line">{s.title}</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
