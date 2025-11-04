import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export interface ClientData {
  id: string;
  client_name: string;
  industry: string;
  description_input: string;
  target_audience: string;
  posting_frequency: string;
  email: string;
  phone: string;
  youtube_channel_id: string;
  youtube_channel_title: string;
  youtube_channel_url: string;
  status: string;
  created_at: string;
}

export class GoogleSheetsService {
  private auth: JWT;
  private sheets;
  private spreadsheetId: string;

  constructor() {
    // Check for required environment variables
    if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is not set');
    }

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('Google service account credentials are not set');
    }

    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    // Initialize Google Sheets API with service account
    this.auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    this.sheets = google.sheets({ version: 'v4', auth: this.auth });
  }

  /**
   * Add a new client to the Google Sheet
   */
  async addClient(clientData: ClientData): Promise<void> {
    try {
      const values = [
        [
          clientData.id,
          clientData.client_name,
          clientData.industry,
          clientData.description_input,
          clientData.target_audience,
          clientData.posting_frequency,
          clientData.email,
          clientData.phone,
          clientData.youtube_channel_id,
          clientData.youtube_channel_title,
          clientData.youtube_channel_url,
          '', // description (to be filled by AI)
          '', // keywords (to be filled by AI)
          '', // banner_tagline (to be filled by AI)
          '', // trailer_script (to be filled by AI)
          clientData.status,
          '', // errors
          clientData.created_at,
        ],
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Clients!A:R', // Adjust range based on your columns
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      });

      console.log('✅ Client added to Google Sheets');
    } catch (error) {
      console.error('❌ Error adding client to Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Get all clients from the sheet
   */
  async getClients(): Promise<any[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Clients!A2:R', // Skip header row
      });

      return response.data.values || [];
    } catch (error) {
      console.error('❌ Error getting clients from Google Sheets:', error);
      throw error;
    }
  }

  /**
   * Update client status
   */
  async updateClientStatus(clientId: string, status: string): Promise<void> {
    try {
      // First, find the row with this client ID
      const clients = await this.getClients();
      const rowIndex = clients.findIndex((row) => row[0] === clientId);

      if (rowIndex === -1) {
        throw new Error(`Client ${clientId} not found`);
      }

      // Update status column (column P, index 15)
      const rowNumber = rowIndex + 2; // +2 because: 1 for header, 1 for 0-index
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: `Clients!P${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[status]],
        },
      });

      console.log(`✅ Updated client ${clientId} status to ${status}`);
    } catch (error) {
      console.error('❌ Error updating client status:', error);
      throw error;
    }
  }
}
