import React, { useState, useEffect } from 'react';

export default function SongSearch({ songs, onSelect, placeholder = "Search songs..." }) {
  const [query, setQuery] = useState('');
  const [filteredSongs, setFilteredSongs] = useState(songs);

  useEffect(() => {
    if (!query.trim()) {
      setFilteredSongs(songs);
      return;
    }

    const searchTerms = query.toLowerCase().split(' ');
    const filtered = songs.filter(song => {
      const title = song.title.toLowerCase();
      const artist = (song.artist || '').toLowerCase();
      
      // Check if all search terms are found in either title or artist
      return searchTerms.every(term => 
        title.includes(term) || artist.includes(term)
      );
    });

    setFilteredSongs(filtered);
  }, [query, songs]);

  return (
    <div className="song-search">
      <input
        type="text"
        className="input search-input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {query.trim() && (
        <div className="search-results">
          {filteredSongs.length === 0 ? (
            <div className="no-results">No songs found</div>
          ) : (
            <div className="results-grid">
              {filteredSongs.map((song) => (
                <button
                  key={song.song_id}
                  className="song-result"
                  onClick={() => {
                    onSelect(song);
                    setQuery('');
                  }}
                >
                  <div className="song-result-art">
                    {song.album_cover_url ? (
                      <img
                        src={song.album_cover_url.startsWith('http') 
                          ? song.album_cover_url 
                          : `${process.env.REACT_APP_API_BASE || 'http://localhost:5001'}${song.album_cover_url}`}
                        alt={song.title}
                      />
                    ) : (
                      <div className="placeholder-art">♪</div>
                    )}
                  </div>
                  <div className="song-result-info">
                    <div className="song-result-title">{song.title}</div>
                    <div className="song-result-artist">{song.artist || 'Unknown Artist'}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}