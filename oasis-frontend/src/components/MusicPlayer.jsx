import React, { useEffect, useRef, useState } from 'react';
import { fetchJSON } from '../api';

function formatTime(sec = 0) {
  if (!sec || isNaN(sec)) return '0:00';
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  const m = Math.floor(sec / 60);
  return `${m}:${s}`;
}

export default function MusicPlayer({ 
  song, 
  autoPlay = false, 
  onEnded,
  showPlaylistControls = false,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false
}) {
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

  // Function to record a stream
  const recordStream = async (songId) => {
    if (!songId) return false;
    
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to play music');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/api/history`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ song_id: songId })
      });
      
      if (response.status === 401) {
        alert('Please log in to play music');
        return false;
      }
      
      if (response.status === 403) {
        const data = await response.json();
        // Pause playback
        audioRef.current?.pause();
        setPlaying(false);
        // Show alert to user
        alert(data.message || 'You have reached your daily streaming limit. Please upgrade to premium for unlimited streaming.');
        return false;
      }
      
      if (!response.ok) {
        console.error('Failed to record stream');
        return false;
      }

      const data = await response.json();
      // If we got streaming stats back, update them in the UI
      if (data.streaming_stats) {
        if (data.streaming_stats.songs_remaining <= 3) {
          alert(`You have ${data.streaming_stats.songs_remaining} songs remaining in your daily limit.`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error recording stream:', error);
      setPlaying(false);
      return false;
    }
  };

  useEffect(() => {
    // when song changes, load. Only autoplay if autoPlay === true.
    const a = audioRef.current;
    if (!a || !song) return;
    
    setProgress(0);
    setDuration(0);
    a.pause();
    a.load();
    
    const startPlayback = async () => {
      // First try to record the stream
      const streamOk = await recordStream(song.song_id);
      if (!streamOk) {
        setPlaying(false);
        return;
      }
      
      try {
        await a.play();
        setPlaying(true);
      } catch (error) {
        console.error('Playback failed:', error);
        setPlaying(false);
      }
    };

    if (song && autoPlay) {
      startPlayback();
    } else {
      setPlaying(false);
    }

    // Add ended event listener
    const onEnd = () => {
      setPlaying(false);
      onEnded?.();
    };
    a.addEventListener('ended', onEnd);
    return () => a.removeEventListener('ended', onEnd);
  }, [song, API_BASE, autoPlay, onEnded]);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a || !song) return;

    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      // Check for login first
      if (!localStorage.getItem('token')) {
        alert('Please log in to play music');
        return;
      }
      
      // Record stream before attempting to play
      const streamOk = await recordStream(song.song_id);
      if (!streamOk) return;
      
      try {
        await a.play();
        setPlaying(true);
      } catch (error) {
        console.error('Playback failed:', error);
        setPlaying(false);
      }
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
        {showPlaylistControls && (
          <button 
            className="btn-control" 
            onClick={onPrevious}
            disabled={!hasPrevious}
            title="Previous track"
          >
            ⏮
          </button>
        )}
        <button 
          className="btn-play" 
          onClick={toggle} 
          aria-pressed={playing}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        {showPlaylistControls && (
          <button 
            className="btn-control" 
            onClick={onNext}
            disabled={!hasNext}
            title="Next track"
          >
            ⏭
          </button>
        )}
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
