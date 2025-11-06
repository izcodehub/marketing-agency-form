import { google, youtube_v3 } from 'googleapis';
import { OAuth2Service } from './oauth2';
import fs from 'fs';
import axios from 'axios';

export interface ChannelSetupData {
  channelId: string;
  title: string;
  description: string;
  keywords: string[];
  bannerUrl?: string;
  trailerUrl?: string;
}

export interface ChannelSetupResult {
  channelId: string;
  channelUrl: string;
  success: boolean;
  updates: {
    description: boolean;
    keywords: boolean;
    banner: boolean;
    trailer: boolean;
  };
}

export class YouTubeOAuth2Service {
  private youtube: youtube_v3.Youtube;
  private oauth2Service: OAuth2Service;

  constructor() {
    this.oauth2Service = OAuth2Service.getInstance();
    const auth = this.oauth2Service.getClient();
    this.youtube = google.youtube({ version: 'v3', auth });
  }

  /**
   * Setup a manually-created YouTube channel with generated assets
   */
  async setupChannel(data: ChannelSetupData): Promise<ChannelSetupResult> {
    await this.oauth2Service.ensureValidToken();

    const result: ChannelSetupResult = {
      channelId: data.channelId,
      channelUrl: `https://youtube.com/channel/${data.channelId}`,
      success: false,
      updates: {
        description: false,
        keywords: false,
        banner: false,
        trailer: false,
      },
    };

    try {
      // 1. Update channel metadata (description, keywords)
      await this.updateChannelMetadata(data);
      result.updates.description = true;
      result.updates.keywords = true;

      // 2. Upload banner if provided
      if (data.bannerUrl) {
        await this.uploadBanner(data.channelId, data.bannerUrl);
        result.updates.banner = true;
      }

      // 3. Set trailer video if provided
      if (data.trailerUrl) {
        // First upload the video, then set as trailer
        const videoId = await this.uploadTrailer(data);
        await this.setChannelTrailer(data.channelId, videoId);
        result.updates.trailer = true;
      }

      result.success = true;
      console.log('✅ Channel setup completed:', data.channelId);
    } catch (error) {
      console.error('❌ Error setting up channel:', error);
      throw error;
    }

    return result;
  }

  /**
   * Update channel description and keywords
   */
  private async updateChannelMetadata(data: ChannelSetupData): Promise<void> {
    try {
      await this.youtube.channels.update({
        part: ['brandingSettings'],
        requestBody: {
          id: data.channelId,
          brandingSettings: {
            channel: {
              description: data.description,
              keywords: data.keywords.join(', '),
              trackingAnalyticsAccountId: '',
              unsubscribedTrailer: '',
            },
          },
        },
      });

      console.log('✅ Updated channel metadata');
    } catch (error) {
      console.error('Error updating channel metadata:', error);
      throw error;
    }
  }

  /**
   * Upload channel banner
   */
  private async uploadBanner(channelId: string, bannerUrl: string): Promise<void> {
    try {
      // Download banner from URL
      const response = await axios.get(bannerUrl, { responseType: 'arraybuffer' });
      const bannerBuffer = Buffer.from(response.data);

      // Upload banner
      await this.youtube.channelBanners.insert({
        requestBody: {},
        media: {
          mimeType: 'image/png',
          body: bannerBuffer as any,
        },
      });

      console.log('✅ Uploaded channel banner');
    } catch (error) {
      console.error('Error uploading banner:', error);
      throw error;
    }
  }

  /**
   * Upload trailer video
   */
  private async uploadTrailer(data: ChannelSetupData): Promise<string> {
    if (!data.trailerUrl) {
      throw new Error('No trailer URL provided');
    }

    try {
      // Download video from URL
      const response = await axios.get(data.trailerUrl, { responseType: 'stream' });

      // Upload video
      const uploadResponse = await this.youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: `${data.title} - Channel Trailer`,
            description: data.description,
            tags: data.keywords,
            categoryId: '22', // People & Blogs
          },
          status: {
            privacyStatus: 'public',
          },
        },
        media: {
          body: response.data,
        },
      });

      const videoId = uploadResponse.data.id!;
      console.log('✅ Uploaded trailer video:', videoId);
      return videoId;
    } catch (error) {
      console.error('Error uploading trailer:', error);
      throw error;
    }
  }

  /**
   * Set a video as the channel trailer
   */
  private async setChannelTrailer(channelId: string, videoId: string): Promise<void> {
    try {
      await this.youtube.channels.update({
        part: ['brandingSettings'],
        requestBody: {
          id: channelId,
          brandingSettings: {
            channel: {
              unsubscribedTrailer: videoId,
            },
          },
        },
      });

      console.log('✅ Set channel trailer');
    } catch (error) {
      console.error('Error setting trailer:', error);
      throw error;
    }
  }

  /**
   * Get channel information
   */
  async getChannelInfo(channelId: string): Promise<any> {
    await this.oauth2Service.ensureValidToken();

    try {
      const response = await this.youtube.channels.list({
        part: ['snippet', 'brandingSettings', 'statistics'],
        id: [channelId],
      });

      return response.data.items?.[0];
    } catch (error) {
      console.error('Error getting channel info:', error);
      throw error;
    }
  }

  /**
   * Upload a video to a channel
   */
  async uploadVideo(
    channelId: string,
    videoPath: string,
    title: string,
    description: string,
    tags: string[]
  ): Promise<string> {
    await this.oauth2Service.ensureValidToken();

    try {
      const response = await this.youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title,
            description,
            tags,
            categoryId: '22',
          },
          status: {
            privacyStatus: 'public',
          },
        },
        media: {
          body: fs.createReadStream(videoPath),
        },
      });

      const videoId = response.data.id!;
      console.log('✅ Uploaded video:', videoId);
      return videoId;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  }
}
