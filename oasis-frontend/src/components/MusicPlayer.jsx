import React, { useEffect, useRef, useState } from 'react';
import { fetchJSON } from '../api';

function formatTime(sec = 0) {
  if (!sec || isNaN(sec)) return '0:00';
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  const m = Math.floor(sec / 60);
  return `${m}:${s}`;
}

export default function MusicPlayer({ song, autoPlay = false }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5001';

  useEffect(() => {
    // Attach audio element listeners whenever the selected song changes.
    // This ensures listeners are attached before we call load() below.
    const a = audioRef.current;
    if (!a) return;

    const onTime = () => setProgress(Number(a.currentTime) || 0);
    const onDur = () => setDuration(Number(a.duration) || 0);

    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onDur);

    return () => {
      try {
        a.removeEventListener('timeupdate', onTime);
        a.removeEventListener('loadedmetadata', onDur);
      } catch (err) {}
    };
  }, [song, API_BASE]);

  useEffect(() => {
    // when song changes, load. Only autoplay if autoPlay === true.
    const a = audioRef.current;
    if (!a) return;
    setProgress(0);
    setDuration(0);
    a.pause();
    a.load();
    if (song && autoPlay) {
      const playPromise = a.play();
      if (playPromise && playPromise.then) {
        playPromise.then(async () => {
          setPlaying(true);
          // send listening history when playback actually starts
          try {
            const body = { song_id: song.song_id, device: navigator.userAgent };
            // if no token present, include user_id from localStorage so backend can accept it
            if (!localStorage.getItem('oasis_token') && localStorage.getItem('oasis_user_id')) {
              body.user_id = Number(localStorage.getItem('oasis_user_id'));
            }
            await fetchJSON('/api/history', { method: 'POST', body: JSON.stringify(body) });
          } catch (e) {
            // ignore; history is best-effort
          }
        }).catch(() => setPlaying(false));
      } else {
        setPlaying(false);
      }
    } else {
      setPlaying(false);
    }
  }, [song, API_BASE, autoPlay]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play();
      setPlaying(true);
      // record history when user explicitly starts playback
      (async () => {
        try {
          const body = { song_id: song.song_id, device: navigator.userAgent };
          if (!localStorage.getItem('oasis_token') && localStorage.getItem('oasis_user_id')) {
            body.user_id = Number(localStorage.getItem('oasis_user_id'));
          }
          await fetchJSON('/api/history', { method: 'POST', body: JSON.stringify(body) });
        } catch (e) {}
      })();
    }
  };

  const seek = (value) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = value;
    setProgress(value);
  };

  if (!song) {
    return (
      <div className="player-empty">
        <h3>No song selected</h3>
        <p className="muted">Select a track from the library to start streaming.</p>
      </div>
    );
  }

  const src = song.file_url && song.file_url.startsWith('http') ? song.file_url : `${API_BASE}${song.file_url}`;

  const cover = song.album_cover_url ? (song.album_cover_url.startsWith('http') ? song.album_cover_url : `${API_BASE}${song.album_cover_url}`) : null;

  return (
    <div className="player-root">
      {cover && (
        <div className="player-cover">
          <img src={cover} alt={`${song.title} cover`} />
        </div>
      )}
      <div className="player-info">
        <div className="player-title">{song.title}</div>
        <div className="player-sub">{song.artist || 'Unknown Artist'}{song.album ? ' • ' + song.album : ''}</div>
      </div>

      <audio ref={audioRef} preload="metadata">
        <source src={src} />
        Your browser does not support the audio element.
      </audio>

      <div className="player-controls">
        <button className="btn-play" onClick={toggle} aria-pressed={playing}>{playing ? 'Pause' : 'Play'}</button>
        <div className="progress-wrap">
          <input
            type="range"
            min={0}
            step={0.1}
            max={duration || 0}
            value={progress}
            onChange={(e) => seek(Number(e.target.value))}
            className="progress"
          />
          <div className="time">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
