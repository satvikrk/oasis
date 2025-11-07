import React, { useState, useEffect } from 'react';
import { API_BASE } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState('');
  const [detailedStats, setDetailedStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('oasis_token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch user profile data
    async function fetchProfile() {
      try {
        const resp = await fetch(`${API_BASE}/api/user/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!resp.ok) {
          const data = await resp.json();
          setError(data.error || 'Failed to load profile');
          return;
        }

        const data = await resp.json();
        setProfileData(data);
      } catch(err) {
        setError(String(err));
      }
    }

    fetchProfile();
  }, [navigate]);

  if (error) {
    return (
      <div className="page-card" style={{maxWidth:600, margin:'40px auto'}}>
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="page-card" style={{maxWidth:600, margin:'40px auto'}}>
        <div className="loading">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="page-card profile-card">
      <div className="profile-header">
        <div className="profile-avatar">
          {profileData.username[0].toUpperCase()}
        </div>
        <h2>{profileData.username}</h2>
      </div>

      <div className="profile-details">
        <div className="detail-row">
          <span className="detail-label">Email</span>
          <span className="detail-value">{profileData.email}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Member Since</span>
          <span className="detail-value">
            {new Date(profileData.date_joined).toLocaleDateString()}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Subscription</span>
          <span className="detail-value subscription-badge">
            {profileData.subscription_type}
          </span>
        </div>

        {profileData.subscription_type === 'free' && (
          <div className="streaming-info">
            <div className="detail-row">
              <span className="detail-label">Songs Streamed Today</span>
              <span className="detail-value">{profileData.songs_streamed}/10</span>
            </div>

            {!profileData.is_allowed_to_stream && (
              <div className="streaming-limit-warning">
                You have reached your daily streaming limit (10 songs). 
                Upgrade to Premium for unlimited streaming or wait until tomorrow.
              </div>
            )}

            {profileData.is_allowed_to_stream && profileData.songs_streamed >= 7 && (
              <div className="streaming-limit-notice">
                You are approaching your daily streaming limit. 
                {profileData.songs_remaining} songs remaining today.
              </div>
            )}
          </div>
        )}

        <div className="profile-stats">
          <div className="stat-cards-grid">
            <div className="stat-card">
              <div className="stat-value">{profileData.total_playlists || 0}</div>
              <div className="stat-label">Playlists Created</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">{profileData.songs_liked || 0}</div>
              <div className="stat-label">Songs Liked</div>
            </div>

            <div className="stat-card">
              <div className="stat-value">{profileData.total_streams || 0}</div>
              <div className="stat-label">Total Streams</div>
            </div>
          </div>

          <button 
            className="stats-button" 
            onClick={async () => {
              try {
                setLoadingStats(true);
                const token = localStorage.getItem('oasis_token');
                const response = await fetch(`${API_BASE}/api/user/detailed-stats`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (!response.ok) {
                  throw new Error('Failed to fetch detailed stats');
                }
                
                const stats = await response.json();
                setDetailedStats(stats);
              } catch (err) {
                setError('Failed to load detailed statistics');
              } finally {
                setLoadingStats(false);
              }
            }}
            disabled={loadingStats}
          >
            {loadingStats ? 'Loading...' : 'View Detailed Statistics'}
          </button>

          {detailedStats && (
            <div className="detailed-stats-wrapper">
              <div className="detailed-stats-header">
                <h3>Your Listening Journey</h3>
              </div>
              <div className="detailed-stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{detailedStats.unique_songs_played}</div>
                  <div className="stat-label">Unique Songs Discovered</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{detailedStats.total_plays}</div>
                  <div className="stat-label">Total Plays</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{detailedStats.total_listening_time}</div>
                  <div className="stat-label">Time Spent With Music</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ fontSize: '1.5rem' }}>{detailedStats.languages_listened || 'None yet'}</div>
                  <div className="stat-label">Languages Explored</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{detailedStats.playlist_count}</div>
                  <div className="stat-label">Personal Playlists</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{detailedStats.likes_count}</div>
                  <div className="stat-label">Favorite Tracks</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {profileData.subscription_type === 'free' && (
          <div className="upgrade-prompt">
            <h3>Upgrade to Premium</h3>
            <p>Enjoy unlimited streaming, no ads, and higher quality audio.</p>
            <button className="btn-premium">Upgrade Now</button>
          </div>
        )}
      </div>
    </div>
  );
}