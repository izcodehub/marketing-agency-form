import { google, youtube_v3 } from 'googleapis';
import { JWT } from 'google-auth-library';

export interface ChannelData {
  channelId: string;
  title: string;
  url: string;
}

export class YouTubeService {
  private auth: JWT;
  private youtube: youtube_v3.Youtube;

  constructor() {
    // Check for required environment variables
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Google service account credentials are not set');
    }

    // Initialize YouTube API with service account
    this.auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: [
        'https://www.googleapis.com/auth/youtube',
        'https://www.googleapis.com/auth/youtube.force-ssl',
      ],
    });

    this.youtube = google.youtube({ version: 'v3', auth: this.auth });
  }

  /**
   * Create a new YouTube channel
   * NOTE: This actually creates a BRAND ACCOUNT channel under your main Google account
   * You'll need to use OAuth2 for this, not service account
   */
  async createChannel(companyName: string, description: string): Promise<ChannelData> {
    try {
      // IMPORTANT: YouTube API doesn't allow creating channels programmatically
      // via service accounts. You have two options:
      //
      // Option 1: Use OAuth2 and create channels under your main account
      // Option 2: Create channels manually and just update their settings here
      //
      // For now, we'll simulate channel creation by returning a test channel
      // In production, you'll need to implement OAuth2 flow

      console.log('⚠️  Creating YouTube channel:', companyName);
      console.log('⚠️  NOTE: This is a placeholder. You need to set up OAuth2 for real channel creation');

      // For MVP: Return your existing channel that you'll manually create
      // Later: Implement proper OAuth2 flow
      const simulatedChannelId = process.env.YOUTUBE_MASTER_CHANNEL_ID || 'PLACEHOLDER_CHANNEL_ID';

      return {
        channelId: simulatedChannelId,
        title: companyName,
        url: `https://www.youtube.com/channel/${simulatedChannelId}`,
      };
    } catch (error) {
      console.error('❌ Error creating YouTube channel:', error);
      throw error;
    }
  }

  /**
   * Update channel branding (description, keywords)
   */
  async updateChannelBranding(
    channelId: string,
    description: string,
    keywords: string[]
  ): Promise<void> {
    try {
      await this.youtube.channels.update({
        part: ['brandingSettings'],
        requestBody: {
          id: channelId,
          brandingSettings: {
            channel: {
              description: description.substring(0, 1000), // Max 1000 chars
              keywords: keywords.join(' '),
            },
          },
        },
      });

      console.log('✅ Channel branding updated');
    } catch (error) {
      console.error('❌ Error updating channel branding:', error);
      throw error;
    }
  }

  /**
   * Upload a video to YouTube
   */
  async uploadVideo(
    channelId: string,
    title: string,
    description: string,
    videoFilePath: string,
    tags: string[]
  ): Promise<string> {
    try {
      const fs = require('fs');

      const response = await this.youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            channelId,
            title,
            description,
            tags,
            categoryId: '22', // People & Blogs category
          },
          status: {
            privacyStatus: 'public',
            selfDeclaredMadeForKids: false,
          },
        },
        media: {
          body: fs.createReadStream(videoFilePath),
        },
      });

      const videoId = response.data.id || '';
      console.log('✅ Video uploaded:', videoId);

      return videoId;
    } catch (error) {
      console.error('❌ Error uploading video:', error);
      throw error;
    }
  }

  /**
   * Get channel details
   */
  async getChannelDetails(channelId: string): Promise<any> {
    try {
      const response = await this.youtube.channels.list({
        part: ['snippet', 'statistics', 'brandingSettings'],
        id: [channelId],
      });

      return response.data.items?.[0] || null;
    } catch (error) {
      console.error('❌ Error getting channel details:', error);
      throw error;
    }
  }

  /**
   * Delete a channel (for when trial expires and not paid)
   * NOTE: This is a destructive operation, use with caution
   */
  async deleteChannel(channelId: string): Promise<void> {
    try {
      // YouTube API doesn't support deleting channels programmatically
      // You'll need to do this manually or use the Admin SDK
      console.log('⚠️  Channel deletion requested:', channelId);
      console.log('⚠️  NOTE: Must be done manually via YouTube Studio');

      // In practice, you might just:
      // 1. Make all videos private
      // 2. Update channel to show "Trial Expired" message
      // 3. Remove all branding
    } catch (error) {
      console.error('❌ Error deleting channel:', error);
      throw error;
    }
  }
}
