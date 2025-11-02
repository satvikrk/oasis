import React, { useState, useEffect } from 'react';
import SongList from './components/SongList';
import MusicPlayer from './components/MusicPlayer';
import './styles.css';
import { BrowserRouter, Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Playlists from './pages/Playlists';
import PlayerPage from './pages/PlayerPage';

function App() {
  const [songs, setSongs] = useState([]);
  const [current, setCurrent] = useState(null);
  const [preview, setPreview] = useState(null);
  const [autoPlayNext, setAutoPlayNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState(localStorage.getItem('oasis_username') || '');

  useEffect(() => {
    let cancelled = false;
    async function fetchSongs() {
      try {
        const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';
        const resp = await fetch(`${API_BASE}/api/songs`);
        const data = await resp.json();
        if (!cancelled) {
          setSongs(data || []);
        }
      } catch (err) {
        console.error('Failed to load songs', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSongs();
    return () => { cancelled = true; };
  }, []);

  // keep username in React state and update on global login event
  useEffect(() => {
    const onLogin = (e) => {
      const name = (e && e.detail && e.detail.username) || localStorage.getItem('oasis_username') || '';
      setUsername(name);
    };
    window.addEventListener('oasis_login', onLogin);
    return () => window.removeEventListener('oasis_login', onLogin);
  }, []);

  // logout handler: clear local storage and update UI
  const logout = () => {
    localStorage.removeItem('oasis_token');
    localStorage.removeItem('oasis_user_id');
    localStorage.removeItem('oasis_username');
    setUsername('');
    try{ window.dispatchEvent(new CustomEvent('oasis_logout')); } catch(e){}
    // navigate home
    window.location.href = '/';
  };

  return (
    <BrowserRouter>
      {/* Listen to route changes so we can clear the currently selected song when leaving the player page */}
      <RouteListener onLeavePlayer={() => { setCurrent(null); setAutoPlayNext(false); }} />
      <div className="app-root">
        <header className="navbar">
          <div className="nav-inner">
            <div className="brand">Oasis</div>
            <nav className="nav-links">
              <NavLink to="/" className={({isActive}) => isActive ? 'active' : ''}>Library</NavLink>
              <NavLink to="/player" className={({isActive}) => isActive ? 'active' : ''}>Player</NavLink>
              <NavLink to="/playlists" className={({isActive}) => isActive ? 'active' : ''}>Playlists</NavLink>
              {/* show username instead of Login link when signed in */}
              {username ? (
                <>
                  <span className="user-badge">{username}</span>
                  <button className="btn-secondary" style={{marginLeft:8}} onClick={logout}>Logout</button>
                </>
              ) : (
                <NavLink to="/login" className={({isActive}) => isActive ? 'active' : ''}>Login</NavLink>
              )}
            </nav>
          </div>
        </header>


        <Routes>
          <Route path="/" element={<Home songs={songs} loading={loading} preview={preview} setPreview={setPreview} setCurrent={setCurrent} setAutoPlayNext={setAutoPlayNext} />} />

          <Route path="/player" element={<PlayerPage songs={songs} current={current} setCurrent={setCurrent} autoPlay={autoPlayNext} />} />
          <Route path="/playlists" element={<Playlists />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

function Home({ songs, loading, preview, setPreview, setCurrent, setAutoPlayNext }){
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <h1>Find your next favorite tune</h1>
          <p className="lead">Stream high-quality tracks instantly. Lightweight, fast and privacy-friendly.</p>
          <button className="cta" onClick={() => window.scrollTo({ top: 700, behavior: 'smooth' })}>Browse Library</button>
        </div>
      </section>
    <main className="main">
      <section id="library" className="library">
        <div className="section-header">
          <h2>Library</h2>
          <p className="muted">{songs.length} tracks available</p>
        </div>

        <div className="content-row">
          <div className="left-col">
            {loading ? <div className="loading">Loading songs…</div> : (
              <>
                {preview && (
                  <div className="page-card" style={{marginBottom:12}}>
                    <div style={{display:'flex',gap:12,alignItems:'center'}}>
                      {preview.album_cover_url ? <img src={(preview.album_cover_url.startsWith('http')? preview.album_cover_url : API_BASE + preview.album_cover_url)} alt="cover" style={{width:84,height:84,objectFit:'cover',borderRadius:8}} /> : null}
                      <div>
                        <div style={{fontWeight:700}}>{preview.title}</div>
                        <div className="muted">{preview.artist || 'Unknown Artist'} • {preview.album || 'Single'}</div>
                        <div style={{marginTop:8}}>
                          <button className="btn-primary" onClick={() => { setCurrent(preview); setAutoPlayNext(true); navigate('/player'); }}>Play in player</button>
                          <button className="btn-secondary" style={{marginLeft:8}} onClick={() => setPreview(null)}>Clear</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <SongList songs={songs} selectedId={null} onPreview={s => setPreview(s)} />
              </>
            )}
          </div>

          <aside id="player" className="right-col">
            <div className="player-card">
              <MusicPlayer song={null} />
            </div>
          </aside>
        </div>
      </section>

      <section id="about" className="about">
        <h3>About Oasis</h3>
        <p className="muted">A minimal music streaming web app built for experimentation and learning. Add your own backend API to stream files.</p>
      </section>
    </main>
    </>
  );
}

function RouteListener({ onLeavePlayer }){
  const loc = useLocation();
  const prev = React.useRef(loc.pathname);
  useEffect(() => {
    if (prev.current === '/player' && loc.pathname !== '/player'){
      onLeavePlayer?.();
    }
    prev.current = loc.pathname;
  }, [loc.pathname, onLeavePlayer]);
  return null;
}

export default App;
