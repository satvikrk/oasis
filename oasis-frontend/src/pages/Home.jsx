import React from 'react';
import SongList from '../components/SongList';

export default function Home({ songs, onSelectSong }) {
  return (
    <div>
      <h2>Song Library</h2>
      <SongList songs={songs} onSelectSong={onSelectSong} />
    </div>
  );
}
