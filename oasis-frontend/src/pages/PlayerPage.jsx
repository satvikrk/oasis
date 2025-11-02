import React from 'react';
import MusicPlayer from '../components/MusicPlayer';
import SongList from '../components/SongList';

export default function PlayerPage({ songs, current, setCurrent, autoPlay }){
  return (
    <div style={{maxWidth:1200, margin:'24px auto', display:'flex', gap:20}}>
      <div style={{flex:1, paddingRight:12}}>
        <div style={{paddingLeft:12}}> {/* ensure song tiles aren't flush to the left edge */}
          <SongList songs={songs} selectedId={current?.song_id} onSelectSong={s => setCurrent(s)} />
        </div>
      </div>
      <div style={{width:420}}>
        <div style={{padding:12, background:'rgba(255,255,255,0.02)', borderRadius:8}}>
          <MusicPlayer song={current} autoPlay={autoPlay} />
        </div>
      </div>
    </div>
  );
}
