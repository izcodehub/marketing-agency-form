import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

const TOKEN_PATH = path.join(__dirname, '../../tokens.json');

interface TokenData {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

export class OAuth2Service {
  private oauth2Client: OAuth2Client;
  private static instance: OAuth2Service;

  private constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'urn:ietf:wg:oauth:2.0:oob';

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Load existing tokens if available
    this.loadTokens();
  }

  public static getInstance(): OAuth2Service {
    if (!OAuth2Service.instance) {
      OAuth2Service.instance = new OAuth2Service();
    }
    return OAuth2Service.instance;
  }

  private loadTokens(): void {
    try {
      if (fs.existsSync(TOKEN_PATH)) {
        const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
        this.oauth2Client.setCredentials(tokens);
        console.log('OAuth2 tokens loaded successfully');
      } else {
        console.log('No existing tokens found. Authorization needed.');
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
    }
  }

  private saveTokens(tokens: TokenData): void {
    try {
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
      console.log('Tokens saved successfully');
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  public getAuthUrl(): string {
    const scopes = [
      'https://www.googleapis.com/auth/youtube',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/spreadsheets',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force to get refresh token
    });
  }

  public async authorize(code: string): Promise<void> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      this.saveTokens(tokens as TokenData);
      console.log('Authorization successful!');
    } catch (error) {
      console.error('Error during authorization:', error);
      throw new Error('Failed to authorize with Google');
    }
  }

  public async refreshAccessToken(): Promise<void> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      this.saveTokens(credentials as TokenData);
      console.log('Access token refreshed');
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  public getClient(): OAuth2Client {
    return this.oauth2Client;
  }

  public isAuthorized(): boolean {
    const credentials = this.oauth2Client.credentials;
    return !!(credentials && credentials.access_token);
  }

  public async ensureValidToken(): Promise<void> {
    if (!this.isAuthorized()) {
      throw new Error('Not authorized. Please complete OAuth2 flow first.');
    }

    const credentials = this.oauth2Client.credentials;
    const now = Date.now();

    // Refresh if token expires in less than 5 minutes
    if (credentials.expiry_date && credentials.expiry_date - now < 5 * 60 * 1000) {
      await this.refreshAccessToken();
    }
  }
}
