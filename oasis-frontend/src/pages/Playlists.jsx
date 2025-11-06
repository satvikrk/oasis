import React, { useEffect, useState } from 'react';
import { API_BASE } from '../api';
import { Link, useNavigate } from 'react-router-dom';
import SongSearch from '../components/SongSearch';
import MusicPlayer from '../components/MusicPlayer';

export default function Playlists() {
  const [playlists, setPlaylists] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [songs, setSongs] = useState([]); // All available songs
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();

  // Load all songs for search functionality
  useEffect(() => {
    async function loadSongs() {
      try {
        const resp = await fetch(`${API_BASE}/api/songs`);
        const data = await resp.json();
        setSongs(data || []);
      } catch (err) {
        console.error('Failed to load songs:', err);
      }
    }
    loadSongs();
  }, []);

  async function load() {
    setError('');
    try {
      const resp = await fetch(`${API_BASE}/api/playlists`, { headers: {'Authorization': `Bearer ${localStorage.getItem('oasis_token')}`} });
      const data = await resp.json();
      if (!resp.ok) {
        setPlaylists([]);
        setError(data && data.error ? data.error : 'Failed to load playlists');
        return;
      }
      setPlaylists(Array.isArray(data) ? data : []);
    } catch(err) {
      setPlaylists([]);
      setError(String(err));
    }
  }

  useEffect(() => { load(); }, []);

  async function create() {
    if (!title) return;
    try {
      const resp = await fetch(`${API_BASE}/api/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('oasis_token')}`
        },
        body: JSON.stringify({ title, description })
      });
      
      if (!resp.ok) {
        const d = await resp.json();
        setError(d.error || 'Failed to create playlist');
        return;
      }
      
      const data = await resp.json();
      const playlistId = data.playlist_id;
      
      // Add selected songs to playlist
      for (const song of selectedSongs) {
        await fetch(`${API_BASE}/api/playlists/${playlistId}/songs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('oasis_token')}`
          },
          body: JSON.stringify({ song_id: song.song_id })
        });
      }
      
      setTitle('');
      setDescription('');
      setSelectedSongs([]);
      setIsCreating(false);
      load();
    } catch(err) {
      setError(String(err));
    }
  }

  async function removeSongFromPlaylist(playlistId, songId) {
    try {
      const resp = await fetch(`${API_BASE}/api/playlists/${playlistId}/songs/${songId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('oasis_token')}`
        }
      });
      if (!resp.ok) {
        const data = await resp.json();
        setError(data.error || 'Failed to remove song');
        return;
      }
      
      // Update the local state immediately
      if (selectedPlaylist) {
        setSelectedPlaylist(prev => ({
          ...prev,
          songs: prev.songs.filter(s => s.song_id !== songId)
        }));
      }
      
      // Also update the main playlists array
      setPlaylists(prevPlaylists => 
        prevPlaylists.map(p => 
          p.playlist_id === playlistId 
            ? { ...p, songs: (p.songs || []).filter(s => s.song_id !== songId) }
            : p
        )
      );
    } catch(err) {
      setError(String(err));
    }
  }
  
  async function deletePlaylist(playlistId) {
    try {
      const resp = await fetch(`${API_BASE}/api/playlists/${playlistId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('oasis_token')}`
        }
      });
      if (!resp.ok) {
        const data = await resp.json();
        setError(data.error || 'Failed to delete playlist');
        return;
      }
      setDeleteConfirm(null);
      setSelectedPlaylist(null);
      // Update playlists list immediately
      setPlaylists(prev => prev.filter(p => p.playlist_id !== playlistId));
      
      // If this was the currently playing playlist, stop playback
      if (currentPlaylist?.playlist_id === playlistId) {
        setCurrentPlaylist(null);
        setCurrentSong(null);
        setCurrentIndex(0);
      }
    } catch(err) {
      setError(String(err));
    }
  }

  async function addSongToPlaylist(song) {
    if (!selectedPlaylist) return;
    
    try {
      // First attempt to save to backend
      const resp = await fetch(`${API_BASE}/api/playlists/${selectedPlaylist.playlist_id}/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('oasis_token')}`
        },
        body: JSON.stringify({ song_id: song.song_id })
      });

      if (!resp.ok) {
        const data = await resp.json();
        setError(data.error || 'Failed to add song');
        return;
      }

      // If backend save successful, update UI
      const updatedSong = { ...song };
      setSelectedPlaylist(prev => ({
        ...prev,
        songs: [...(prev.songs || []), updatedSong]
      }));

      // Also update the main playlists array
      setPlaylists(prevPlaylists =>
        prevPlaylists.map(p =>
          p.playlist_id === selectedPlaylist.playlist_id
            ? { ...p, songs: [...(p.songs || []), updatedSong] }
            : p
        )
      );
    } catch(err) {
      setError(String(err));
    }
  }

  async function savePlaylistChanges() {
    setSelectedPlaylist(null);
    // Reload playlists to ensure we have the latest data
    await load();
  }

  function onPlayPlaylist(playlist) {
    if (playlist.songs && playlist.songs.length > 0) {
      setCurrentPlaylist(playlist);
      setCurrentIndex(0);
      setCurrentSong(playlist.songs[0]);
    }
  }

  // Navigate to next/previous songs in playlist
  function playNext() {
    if (!currentPlaylist?.songs || currentIndex >= currentPlaylist.songs.length - 1) return;
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setCurrentSong(currentPlaylist.songs[nextIndex]);
  }

  function playPrevious() {
    if (!currentPlaylist?.songs || currentIndex <= 0) return;
    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);
    setCurrentSong(currentPlaylist.songs[prevIndex]);
  }

  // Auto-advance to next song when current song ends
  function onSongEnd() {
    if (currentPlaylist?.songs && currentIndex < currentPlaylist.songs.length - 1) {
      playNext();
    }
  }

  const renderPlaylistGrid = () => (
    <div className="playlist-grid" style={{marginTop:16}}>
      {playlists.length === 0 && !error && <div className="muted">No playlists yet.</div>}
      
      {playlists.map(p => (
        <div key={p.playlist_id} className="playlist-card">
          <div className="playlist-header">
            <div className="playlist-title">{p.title}</div>
            <div className="playlist-actions">
              <button className="btn-secondary btn-small" onClick={() => onPlayPlaylist(p)}>Play</button>
              <button className="btn-secondary btn-small" onClick={() => setSelectedPlaylist(p)}>Edit</button>
            </div>
          </div>
          <div className="playlist-meta muted">{(p.songs && p.songs.length) || 0} songs</div>
          <div className="playlist-songs">
            {p.songs?.map(s => (
              <div key={s.song_id} className="song-line">
                <span>{s.title}</span>
                <button 
                  className="btn-icon" 
                  onClick={() => removeSongFromPlaylist(p.playlist_id, s.song_id)}
                  title="Remove from playlist"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  const renderCreateForm = () => (
    <div className="create-playlist-form">
      <h3>Create New Playlist</h3>
      <div className="form-vertical">
        <div>
          <label className="form-label">Title</label>
          <input 
            className="input" 
            placeholder="Enter playlist title" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
          />
        </div>
        
        <div>
          <label className="form-label">Description</label>
          <textarea 
            className="input" 
            placeholder="Enter playlist description" 
            value={description} 
            onChange={e => setDescription(e.target.value)} 
          />
        </div>

        <div>
          <label className="form-label">Add Songs</label>
          <SongSearch 
            songs={songs} 
            onSelect={song => setSelectedSongs(prev => [...prev, song])}
            placeholder="Search songs to add..."
          />
        </div>

        {selectedSongs.length > 0 && (
          <div className="selected-songs">
            <label className="form-label">Selected Songs</label>
            <div className="selected-songs-list">
              {selectedSongs.map(song => (
                <div key={song.song_id} className="selected-song">
                  <span>{song.title}</span>
                  <button 
                    className="btn-icon" 
                    onClick={() => setSelectedSongs(prev => prev.filter(s => s.song_id !== song.song_id))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-buttons">
          <button className="btn-primary" onClick={create}>Create Playlist</button>
          <button className="btn-secondary" onClick={() => {
            setIsCreating(false);
            setTitle('');
            setDescription('');
            setSelectedSongs([]);
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );

  const renderEditPlaylist = () => (
    <div className="edit-playlist">
      <div className="edit-playlist-header">
        <h3>Edit Playlist: {selectedPlaylist.title}</h3>
        <div className="edit-actions">
          <button 
            className="btn-danger" 
            onClick={() => setDeleteConfirm(selectedPlaylist)}
            title="Delete playlist"
          >
            Delete Playlist
          </button>
        </div>
      </div>
      
      <div className="form-vertical">
        <div className="edit-search-section">
          <label className="form-label">Add Songs</label>
          <SongSearch 
            songs={songs.filter(song => 
              !selectedPlaylist.songs?.some(s => s.song_id === song.song_id)
            )} 
            onSelect={addSongToPlaylist}
            placeholder="Search songs to add..."
          />
        </div>
        
        <div className="playlist-songs edit-mode">
          <label className="form-label">Current Songs ({selectedPlaylist.songs?.length || 0})</label>
          <div className="current-songs-list">
            {selectedPlaylist.songs?.map(s => (
              <div key={s.song_id} className="song-line">
                <div className="song-info">
                  <span className="song-title">{s.title}</span>
                  <span className="song-artist">{s.artist || 'Unknown Artist'}</span>
                </div>
                <button 
                  className="btn-icon" 
                  onClick={() => removeSongFromPlaylist(selectedPlaylist.playlist_id, s.song_id)}
                  title="Remove from playlist"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="edit-footer">
          <button className="btn-secondary" onClick={() => setSelectedPlaylist(null)}>
            Done
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h4>Delete Playlist</h4>
            <p>Are you sure you want to delete "{deleteConfirm.title}"? This cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="btn-danger" 
                onClick={() => deletePlaylist(deleteConfirm.playlist_id)}
              >
                Delete
              </button>
              <button 
                className="btn-secondary" 
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="playlists-page">
      <div className="content-row">
        <div className="left-col">
          <div className="page-card" style={{margin:'28px 12px'}}>
            <div className="page-header">
              <h2>Your Playlists</h2>
              <p className="muted">Create and manage your playlists.</p>
            </div>

            {!localStorage.getItem('oasis_token') && (
              <div className="notice">You must <Link to="/login">sign in</Link> to view and create playlists.</div>
            )}

            {!isCreating && !selectedPlaylist && (
              <button 
                className="btn-primary" 
                style={{marginTop: 12}} 
                onClick={() => setIsCreating(true)}
              >
                Create New Playlist
              </button>
            )}

            {error && <div className="error" style={{marginTop:10}}>{error}</div>}

            {isCreating ? renderCreateForm() :
              selectedPlaylist ? renderEditPlaylist() :
              renderPlaylistGrid()}
          </div>
        </div>

        <div className="right-col">
          <div className="player-card">
            <MusicPlayer 
              song={currentSong} 
              autoPlay={true} 
              onEnded={onSongEnd}
              showPlaylistControls={!!currentPlaylist}
              onNext={playNext}
              onPrevious={playPrevious}
              hasNext={currentPlaylist?.songs && currentIndex < currentPlaylist.songs.length - 1}
              hasPrevious={currentPlaylist?.songs && currentIndex > 0}
            />
            {currentPlaylist && (
              <div className="playlist-info">
                <div className="playlist-info-title">
                  Now Playing from: {currentPlaylist.title}
                </div>
                <div className="playlist-info-progress">
                  {currentIndex + 1} of {currentPlaylist.songs.length}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
