import express, { Request, Response } from 'express';
import { GoogleSheetsService } from '../services/googleSheets';
import { YouTubeOAuth2Service } from '../services/youtubeOAuth2';
import { OAuth2Service } from '../services/oauth2';

export const adminRouter = express.Router();

/**
 * GET /api/admin/pending-channels
 * Get all pending channels from Google Sheets
 */
adminRouter.get('/pending-channels', async (req: Request, res: Response) => {
  try {
    const sheetsService = new GoogleSheetsService();
    const clients = await sheetsService.getAllClients();

    // Transform data for dashboard
    const channels = clients.map((client) => ({
      id: client.id,
      companyName: client.client_name,
      industry: client.industry,
      channelName: client.channel_name || `${client.client_name} Marketing`,
      description: client.description_generated || client.description_input,
      keywords: client.keywords?.split(',').map((k: string) => k.trim()) || [],
      bannerUrl: client.banner_url || '',
      trailerUrl: client.trailer_url || '',
      status: client.youtube_channel_id ? 'completed' : client.status || 'pending',
      createdAt: client.created_at || new Date().toISOString(),
      youtubeChannelId: client.youtube_channel_id || undefined,
    }));

    res.json({ channels });
  } catch (error) {
    console.error('Error fetching pending channels:', error);
    res.status(500).json({ error: 'Failed to fetch pending channels' });
  }
});

/**
 * POST /api/admin/setup-channel
 * Setup a manually-created YouTube channel with generated assets
 */
adminRouter.post('/setup-channel', async (req: Request, res: Response) => {
  try {
    const { clientId, youtubeChannelId } = req.body;

    if (!clientId || !youtubeChannelId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate YouTube channel ID format
    if (!/^UC[a-zA-Z0-9_-]{22}$/.test(youtubeChannelId)) {
      return res.status(400).json({ error: 'Invalid YouTube channel ID format' });
    }

    // Get client data from Google Sheets
    const sheetsService = new GoogleSheetsService();
    const client = await sheetsService.getClientById(clientId);

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Setup channel with YouTube API
    const youtubeService = new YouTubeOAuth2Service();
    const result = await youtubeService.setupChannel({
      channelId: youtubeChannelId,
      title: client.channel_name || client.client_name,
      description: client.description_generated || client.description_input,
      keywords: client.keywords?.split(',').map((k: string) => k.trim()) || [],
      bannerUrl: client.banner_url,
      trailerUrl: client.trailer_url,
    });

    // Update Google Sheets with channel ID and URL
    await sheetsService.updateClient(clientId, {
      youtube_channel_id: youtubeChannelId,
      youtube_channel_url: result.channelUrl,
      status: 'completed',
      setup_completed_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      channelId: youtubeChannelId,
      channelUrl: result.channelUrl,
      updates: result.updates,
    });
  } catch (error) {
    console.error('Error setting up channel:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to setup channel',
    });
  }
});

/**
 * GET /api/admin/oauth/url
 * Get OAuth2 authorization URL for initial setup
 */
adminRouter.get('/oauth/url', (req: Request, res: Response) => {
  try {
    const oauth2Service = OAuth2Service.getInstance();
    const authUrl = oauth2Service.getAuthUrl();

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate authorization URL' });
  }
});

/**
 * POST /api/admin/oauth/callback
 * Handle OAuth2 callback and exchange code for tokens
 */
adminRouter.post('/oauth/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required' });
    }

    const oauth2Service = OAuth2Service.getInstance();
    await oauth2Service.authorize(code);

    res.json({
      success: true,
      message: 'Authorization successful! You can now manage YouTube channels.',
    });
  } catch (error) {
    console.error('Error during OAuth callback:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Authorization failed',
    });
  }
});

/**
 * GET /api/admin/oauth/status
 * Check if OAuth2 is configured and authorized
 */
adminRouter.get('/oauth/status', (req: Request, res: Response) => {
  try {
    const oauth2Service = OAuth2Service.getInstance();
    const isAuthorized = oauth2Service.isAuthorized();

    res.json({
      isAuthorized,
      message: isAuthorized
        ? 'OAuth2 is configured and ready'
        : 'OAuth2 authorization required',
    });
  } catch (error) {
    console.error('Error checking OAuth status:', error);
    res.status(500).json({ error: 'Failed to check authorization status' });
  }
});

/**
 * GET /api/admin/channel/:channelId
 * Get channel information from YouTube
 */
adminRouter.get('/channel/:channelId', async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;

    const youtubeService = new YouTubeOAuth2Service();
    const channelInfo = await youtubeService.getChannelInfo(channelId);

    res.json({ channel: channelInfo });
  } catch (error) {
    console.error('Error fetching channel info:', error);
    res.status(500).json({ error: 'Failed to fetch channel information' });
  }
});
