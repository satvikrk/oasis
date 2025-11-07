import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';

export default function Admin() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [songs, setSongs] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  
  // New song form state
  const [newSong, setNewSong] = useState({
    title: '',
    duration: '',
    language: '',
    file_url: '',
    album_id: '',
    artist_name: '',
    album_name: '',
    album_release_date: '',
    album_genre: ''
  });

  // New user form state
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', subscription_type: 'free', is_admin: false });

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('oasis_token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Check if user is admin
    fetch(`${API_BASE}/api/admin/verify`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(resp => {
      if (!resp.ok) throw new Error('Not authorized');
      loadData();
    })
    .catch(() => {
      navigate('/');
    });
  }, [navigate]);

  const loadData = async () => {
    const token = localStorage.getItem('oasis_token');
    try {
      setLoading(true);
      
      // Load users
      const usersResp = await fetch(`${API_BASE}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (usersResp.ok) {
        const userData = await usersResp.json();
        setUsers(userData);
      }

      // Load songs
      const songsResp = await fetch(`${API_BASE}/api/songs`);
      if (songsResp.ok) {
        const songData = await songsResp.json();
        setSongs(songData);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    const token = localStorage.getItem('oasis_token');
    try {
      const resp = await fetch(`${API_BASE}/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!resp.ok) throw new Error('Failed to update user');
      loadData();
    } catch (err) {
      setError('Failed to update user');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('oasis_token');
    try {
      const resp = await fetch(`${API_BASE}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });
      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { data = text; }
      if (!resp.ok) throw new Error((data && data.error) ? data.error : 'Failed to create user');
      setNewUser({ username: '', email: '', password: '', subscription_type: 'free', is_admin: false });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    }
  };

  const handleDeleteSong = async (songId) => {
  if (!window.confirm('Delete this song? This action cannot be undone.')) return;
    const token = localStorage.getItem('oasis_token');
    try {
      const resp = await fetch(`${API_BASE}/api/admin/songs/${songId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!resp.ok) {
        const text = await resp.text();
        let data;
        try { data = JSON.parse(text); } catch(e) { data = text; }
        throw new Error((data && data.error) ? data.error : 'Failed to delete song');
      }
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete song');
    }
  };

  // Analytics state & handlers
  const [analyticsResults, setAnalyticsResults] = useState({});
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [playlistQueryId, setPlaylistQueryId] = useState('');

  const runAnalytics = async (type, extra) => {
    const token = localStorage.getItem('oasis_token');
    setError('');
    setAnalyticsLoading(true);
    try {
      let url = `${API_BASE}/api/admin/analytics/${type}`;
      if (type === 'playlist-count') {
        url = `${API_BASE}/api/playlist/${extra}/count`;
      }
      const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { data = text; }
      if (!resp.ok) throw new Error((data && data.error) ? data.error : `Request failed: ${resp.status}`);
      setAnalyticsResults(prev => ({ ...prev, [type]: data }));
    } catch (err) {
      setError(err.message || 'Analytics request failed');
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleAddSong = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('oasis_token');
    
    try {
      // First upload the file if selected
      let fileUrl = newSong.file_url;
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const uploadResp = await fetch(`${API_BASE}/api/admin/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        
        const uploadText = await uploadResp.text();
        let uploadData;
        try { uploadData = JSON.parse(uploadText); } catch(e) { uploadData = uploadText; }
        if (!uploadResp.ok) {
          const msg = (uploadData && uploadData.error) ? uploadData.error : `Upload failed: ${uploadResp.status}`;
          throw new Error(msg);
        }
        const { url } = (uploadData && uploadData.url) ? uploadData : { url: uploadData };
        fileUrl = url;
      }

      // Then create the song
      // Normalize duration: if user entered mm:ss, convert to 00:MM:SS (MySQL TIME expects HH:MM:SS)
      let durationToSend = newSong.duration || '';
      const mmss = durationToSend.match(/^([0-9]{1,2}):([0-9]{2})$/);
      if (mmss) {
        // mm:ss -> 00:MM:SS
        durationToSend = `00:${mmss[1].padStart(2,'0')}:${mmss[2]}`;
      }

  // ensure album_id is null when empty so backend inserts NULL
  const payload = { ...newSong, file_url: fileUrl, duration: durationToSend };
  if (payload.album_id === '' || payload.album_id === undefined) payload.album_id = null;
      const resp = await fetch(`${API_BASE}/api/admin/songs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const text = await resp.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { data = text; }
      if (!resp.ok) {
        const msg = (data && data.error) ? data.error : `Add song failed: ${resp.status}`;
        throw new Error(msg);
      }
      
      setNewSong({ title: '', duration: '', language: '', file_url: '', album_id: '' });
      setSelectedFile(null);
      loadData();
    } catch (err) {
      // show backend error if available
      setError(err.message || 'Failed to add song');
      console.error('Add song error', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Manage Users
          </button>
          <button 
            className={`tab-btn ${activeTab === 'songs' ? 'active' : ''}`}
            onClick={() => setActiveTab('songs')}
          >
            Manage Songs
          </button>
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {activeTab === 'users' && (
        <div className="users-section">
          <h2>Users</h2>
          <div className="page-card" style={{marginBottom:12}}>
            <h3>Create New User</h3>
            <form onSubmit={handleAddUser} className="form-vertical">
              <label className="form-label">Username</label>
              <input className="input" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} required />
              <label className="form-label">Email</label>
              <input className="input" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
              <label className="form-label">Password</label>
              <input className="input" type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
              <label className="form-label">Subscription</label>
              <select value={newUser.subscription_type} onChange={e => setNewUser({...newUser, subscription_type: e.target.value})}>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </select>
              <div style={{marginTop:8}}>
                <label style={{marginRight:8}}><input type="checkbox" checked={newUser.is_admin} onChange={e => setNewUser({...newUser, is_admin: e.target.checked})} /> Make Admin</label>
              </div>
              <div style={{marginTop:8}}>
                <button className="btn-primary" type="submit">Create User</button>
              </div>
            </form>
          </div>
          <div className="users-grid">
            {users.map(user => (
              <div key={user.user_id} className="user-card">
                <div className="user-info">
                  <h3>{user.username}</h3>
                  <p>{user.email}</p>
                  <p>Subscription: {user.subscription_type}</p>
                </div>
                <div className="user-actions">
                  <select
                    value={user.subscription_type}
                    onChange={(e) => handleUpdateUser(user.user_id, { subscription_type: e.target.value })}
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                  </select>
                  <button
                    onClick={() => handleUpdateUser(user.user_id, { 
                      is_admin: !user.is_admin 
                    })}
                    className={user.is_admin ? 'btn-danger' : 'btn-secondary'}
                  >
                    {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'songs' && (
        <div className="songs-section">
          <h2>Add New Song</h2>
          <form onSubmit={handleAddSong} className="add-song-form">
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={newSong.title}
                onChange={(e) => setNewSong({...newSong, title: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Duration (mm:ss)</label>
              <input
                type="text"
                value={newSong.duration}
                onChange={(e) => setNewSong({...newSong, duration: e.target.value})}
                placeholder="03:30"
                required
              />
            </div>

            <div className="form-group">
              <label>Language</label>
              <input
                type="text"
                value={newSong.language}
                onChange={(e) => setNewSong({...newSong, language: e.target.value})}
                required
              />
            </div>

            <div className="form-group">
              <label>Artist Name(s) (comma-separated)</label>
              <input
                type="text"
                value={newSong.artist_name}
                onChange={(e) => setNewSong({...newSong, artist_name: e.target.value})}
                placeholder="Artist One, Featured Artist"
              />
            </div>

            <div className="form-group">
              <label>Album Name (optional)</label>
              <input
                type="text"
                value={newSong.album_name}
                onChange={(e) => setNewSong({...newSong, album_name: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Album Release Date (optional)</label>
              <input
                type="date"
                value={newSong.album_release_date}
                onChange={(e) => setNewSong({...newSong, album_release_date: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Album Genre (optional)</label>
              <input
                type="text"
                value={newSong.album_genre}
                onChange={(e) => setNewSong({...newSong, album_genre: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Album ID (optional)</label>
              <input
                type="number"
                value={newSong.album_id}
                onChange={(e) => setNewSong({...newSong, album_id: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Audio File</label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                required
              />
            </div>

            <button type="submit" className="btn-primary">Add Song</button>
          </form>

          <h2>Existing Songs</h2>
          <div className="songs-grid">
            {songs.map(song => (
              <div key={song.song_id} className="song-card">
                <div className="song-info">
                  <h3>{song.title}</h3>
                  <p>Duration: {song.duration}</p>
                  <p>Language: {song.language}</p>
                </div>
                <div style={{marginTop:8}}>
                  <button className="btn-danger" onClick={() => handleDeleteSong(song.song_id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="analytics-section">
          <h2>Admin Analytics</h2>
          <div className="analytics-controls">
            <button className="btn-primary" onClick={() => runAnalytics('top-artists')} disabled={analyticsLoading}>Top Artists</button>
            <button className="btn-primary" onClick={() => runAnalytics('top-albums')} disabled={analyticsLoading} style={{marginLeft:8}}>Top Albums</button>
            <button className="btn-primary" onClick={() => runAnalytics('active-users')} disabled={analyticsLoading} style={{marginLeft:8}}>Active Users (7d)</button>
            <button className="btn-primary" onClick={() => runAnalytics('recent-songs')} disabled={analyticsLoading} style={{marginLeft:8}}>Recent Songs</button>
            <button className="btn-primary" onClick={() => runAnalytics('genre-language')} disabled={analyticsLoading} style={{marginLeft:8}}>Genre/Language</button>
          </div>

          <div style={{marginTop:12}} className="playlist-count-control">
            <label style={{marginRight:8}}>Playlist ID:</label>
            <input type="number" value={playlistQueryId} onChange={e => setPlaylistQueryId(e.target.value)} />
            <button className="btn-primary" onClick={() => runAnalytics('playlist-count', playlistQueryId)} style={{marginLeft:8}}>Get Playlist Count</button>
          </div>

          <div style={{marginTop:16}} className="analytics-results">
            {analyticsLoading && <div className="loading">Running...</div>}
            {Object.keys(analyticsResults).length === 0 && !analyticsLoading && <div className="muted">No results yet — click a query above.</div>}

            {analyticsResults['top-artists'] && (
              <div className="page-card">
                <h3>Top Artists</h3>
                <pre style={{whiteSpace:'pre-wrap', maxHeight:300, overflow:'auto'}}>{JSON.stringify(analyticsResults['top-artists'], null, 2)}</pre>
              </div>
            )}

            {analyticsResults['top-albums'] && (
              <div className="page-card">
                <h3>Top Albums</h3>
                <pre style={{whiteSpace:'pre-wrap', maxHeight:300, overflow:'auto'}}>{JSON.stringify(analyticsResults['top-albums'], null, 2)}</pre>
              </div>
            )}

            {analyticsResults['active-users'] && (
              <div className="page-card">
                <h3>Active Users (7 days)</h3>
                <pre style={{whiteSpace:'pre-wrap', maxHeight:300, overflow:'auto'}}>{JSON.stringify(analyticsResults['active-users'], null, 2)}</pre>
              </div>
            )}

            {analyticsResults['recent-songs'] && (
              <div className="page-card">
                <h3>Recent Songs</h3>
                <pre style={{whiteSpace:'pre-wrap', maxHeight:300, overflow:'auto'}}>{JSON.stringify(analyticsResults['recent-songs'], null, 2)}</pre>
              </div>
            )}

            {analyticsResults['genre-language'] && (
              <div className="page-card">
                <h3>Genre / Language Distribution</h3>
                <pre style={{whiteSpace:'pre-wrap', maxHeight:300, overflow:'auto'}}>{JSON.stringify(analyticsResults['genre-language'], null, 2)}</pre>
              </div>
            )}

            {analyticsResults['playlist-count'] && (
              <div className="page-card">
                <h3>Playlist Count</h3>
                <pre>{JSON.stringify(analyticsResults['playlist-count'], null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}