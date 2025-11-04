import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { GoogleSheetsService } from '../services/googleSheets';
import { YouTubeService } from '../services/youtube';
import axios from 'axios';

export const onboardRouter = express.Router();

interface OnboardRequest {
  companyName: string;
  industry: string;
  mission: string;
  targetAudience: string;
  postingFrequency: string;
  email: string;
  phone: string;
}

onboardRouter.post('/', async (req: Request, res: Response) => {
  try {
    const formData: OnboardRequest = req.body;

    // Validate input
    if (!formData.companyName || !formData.industry || !formData.email) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    console.log('📝 New onboarding request:', formData.companyName);

    // Step 1: Create YouTube channel
    const youtubeService = new YouTubeService();
    const channelData = await youtubeService.createChannel(
      formData.companyName,
      formData.mission
    );

    console.log('✅ YouTube channel created:', channelData.channelId);

    // Step 2: Save to Google Sheets
    const sheetsService = new GoogleSheetsService();
    const clientId = uuidv4();

    await sheetsService.addClient({
      id: clientId,
      client_name: formData.companyName,
      industry: formData.industry,
      description_input: formData.mission,
      target_audience: formData.targetAudience,
      posting_frequency: formData.postingFrequency,
      email: formData.email,
      phone: formData.phone,
      youtube_channel_id: channelData.channelId,
      youtube_channel_title: channelData.title,
      youtube_channel_url: channelData.url,
      status: 'trial',
      created_at: new Date().toISOString(),
    });

    console.log('✅ Client saved to Google Sheets');

    // Step 3: Trigger n8n workflow (if webhook URL is configured)
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
    if (n8nWebhookUrl) {
      try {
        await axios.post(n8nWebhookUrl, {
          clientId,
          channelId: channelData.channelId,
          companyName: formData.companyName,
          industry: formData.industry,
        });
        console.log('✅ n8n workflow triggered');
      } catch (error) {
        console.error('⚠️  Failed to trigger n8n workflow:', error);
        // Don't fail the request if n8n trigger fails
      }
    }

    // Return success response
    res.json({
      success: true,
      clientId,
      channelUrl: channelData.url,
      channelId: channelData.channelId,
      message: 'Channel created successfully. Check your email for next steps!',
    });
  } catch (error) {
    console.error('❌ Error during onboarding:', error);
    res.status(500).json({
      error: 'Failed to process onboarding request',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
