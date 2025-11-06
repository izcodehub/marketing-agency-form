import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

interface PendingChannel {
  id: string;
  companyName: string;
  industry: string;
  channelName: string;
  description: string;
  keywords: string[];
  bannerUrl: string;
  trailerUrl: string;
  status: 'pending' | 'processing' | 'completed';
  createdAt: string;
  youtubeChannelId?: string;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const AdminDashboard: React.FC = () => {
  const [channels, setChannels] = useState<PendingChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<PendingChannel | null>(null);
  const [channelId, setChannelId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Simple password protection (you can enhance this later)
  const ADMIN_PASSWORD = 'admin123'; // TODO: Move to env variable

  useEffect(() => {
    if (isAuthenticated) {
      fetchPendingChannels();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  const fetchPendingChannels = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/pending-channels`);
      if (!response.ok) throw new Error('Failed to fetch channels');
      const data = await response.json();
      setChannels(data.channels);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load channels');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitChannelId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChannel || !channelId.trim()) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/admin/setup-channel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: selectedChannel.id,
          youtubeChannelId: channelId.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to setup channel');
      }

      const result = await response.json();

      // Refresh the list
      await fetchPendingChannels();

      // Reset form
      setSelectedChannel(null);
      setChannelId('');

      alert(`Channel setup successful! Channel URL: ${result.channelUrl}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to setup channel');
    } finally {
      setSubmitting(false);
    }
  };

  const openYouTubeCreate = () => {
    window.open('https://www.youtube.com/create_channel', '_blank');
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <h2>Admin Dashboard</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="btn-primary">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading channels...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Marketing Agency Dashboard</h1>
        <button onClick={fetchPendingChannels} className="btn-refresh">
          🔄 Refresh
        </button>
      </header>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-number">{channels.filter(c => c.status === 'pending').length}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{channels.filter(c => c.status === 'processing').length}</div>
          <div className="stat-label">Processing</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{channels.filter(c => c.status === 'completed').length}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      {channels.length === 0 ? (
        <div className="empty-state">
          <h2>No pending channels</h2>
          <p>New client submissions will appear here.</p>
        </div>
      ) : (
        <div className="channels-grid">
          {channels.map((channel) => (
            <div key={channel.id} className={`channel-card ${channel.status}`}>
              <div className="channel-header">
                <h3>{channel.companyName}</h3>
                <span className={`status-badge ${channel.status}`}>
                  {channel.status}
                </span>
              </div>

              <div className="channel-info">
                <div className="info-row">
                  <strong>Industry:</strong> {channel.industry}
                </div>
                <div className="info-row">
                  <strong>Channel Name:</strong> {channel.channelName}
                </div>
                <div className="info-row">
                  <strong>Created:</strong> {new Date(channel.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="channel-description">
                <strong>Description:</strong>
                <p>{channel.description.substring(0, 150)}...</p>
              </div>

              <div className="channel-keywords">
                <strong>Keywords:</strong>
                <div className="keywords-list">
                  {channel.keywords.slice(0, 5).map((keyword, idx) => (
                    <span key={idx} className="keyword-tag">{keyword}</span>
                  ))}
                </div>
              </div>

              <div className="channel-assets">
                {channel.bannerUrl && (
                  <div className="asset-preview">
                    <img src={channel.bannerUrl} alt="Channel banner" />
                    <a href={channel.bannerUrl} target="_blank" rel="noopener noreferrer">
                      View Banner
                    </a>
                  </div>
                )}
                {channel.trailerUrl && (
                  <div className="asset-link">
                    <a href={channel.trailerUrl} target="_blank" rel="noopener noreferrer">
                      📹 View Trailer Video
                    </a>
                  </div>
                )}
              </div>

              {channel.status === 'pending' && (
                <div className="channel-actions">
                  <button
                    onClick={openYouTubeCreate}
                    className="btn-secondary"
                  >
                    Create Channel on YouTube
                  </button>
                  <button
                    onClick={() => setSelectedChannel(channel)}
                    className="btn-primary"
                  >
                    Submit Channel ID
                  </button>
                </div>
              )}

              {channel.status === 'completed' && channel.youtubeChannelId && (
                <div className="channel-completed">
                  <a
                    href={`https://youtube.com/channel/${channel.youtubeChannelId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="youtube-link"
                  >
                    🎥 View Channel on YouTube
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedChannel && (
        <div className="modal-overlay" onClick={() => setSelectedChannel(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submit Channel ID</h2>
              <button onClick={() => setSelectedChannel(null)} className="modal-close">
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="channel-summary">
                <h3>{selectedChannel.companyName}</h3>
                <p><strong>Channel Name:</strong> {selectedChannel.channelName}</p>
              </div>

              <div className="instructions">
                <h4>Instructions:</h4>
                <ol>
                  <li>Create the channel on YouTube using the button below</li>
                  <li>Use the channel name: <strong>{selectedChannel.channelName}</strong></li>
                  <li>After creation, copy the Channel ID (starts with "UC...")</li>
                  <li>Paste it in the form below</li>
                </ol>

                <button onClick={openYouTubeCreate} className="btn-secondary btn-block">
                  Open YouTube Channel Creation
                </button>
              </div>

              <form onSubmit={handleSubmitChannelId}>
                <div className="form-group">
                  <label>YouTube Channel ID</label>
                  <input
                    type="text"
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    placeholder="UC..."
                    pattern="UC[a-zA-Z0-9_-]{22}"
                    title="Channel ID must start with UC and be 24 characters"
                    required
                  />
                  <small>Find this in YouTube Studio → Settings → Channel → Advanced settings</small>
                </div>

                {error && <div className="error-message">{error}</div>}

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setSelectedChannel(null)}
                    className="btn-secondary"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Setting up...' : 'Submit & Setup Channel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
