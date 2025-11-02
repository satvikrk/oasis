import React from 'react';

export default function SongList({ songs = [], onSelectSong, onPreview, selectedId }) {
  return (
    <div className="song-grid">
      {songs.map((s) => (
        <button
          key={s.song_id}
          className={`song-card ${selectedId === s.song_id ? 'active' : ''}`}
          onClick={() => (onPreview ? onPreview(s) : onSelectSong && onSelectSong(s))}
        >
          <div className="art" aria-hidden>
            {s.album_cover_url ? (
              <img src={s.album_cover_url.startsWith('http') ? s.album_cover_url : (process.env.REACT_APP_API_BASE || 'http://localhost:5001') + s.album_cover_url} alt={s.title} />
            ) : (
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="4" fill="#111827" />
                <path d="M6 15V6l10-1v9" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>

          <div className="meta">
            <div className="title">{s.title}</div>
            <div className="sub">{s.artist || 'Unknown Artist'} • {s.language || 'N/A'}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
