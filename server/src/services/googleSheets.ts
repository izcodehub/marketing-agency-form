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
  youtube_channel_id?: string;
  youtube_channel_title?: string;
  youtube_channel_url?: string;
  channel_name?: string;
  description_generated?: string;
  keywords?: string;
  banner_url?: string;
  trailer_url?: string;
  status: string;
  created_at: string;
  setup_completed_at?: string;
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

  /**
   * Get all clients with parsed data
   */
  async getAllClients(): Promise<ClientData[]> {
    try {
      const rows = await this.getClients();

      return rows.map((row) => ({
        id: row[0] || '',
        client_name: row[1] || '',
        industry: row[2] || '',
        description_input: row[3] || '',
        target_audience: row[4] || '',
        posting_frequency: row[5] || '',
        email: row[6] || '',
        phone: row[7] || '',
        youtube_channel_id: row[8] || '',
        youtube_channel_title: row[9] || '',
        youtube_channel_url: row[10] || '',
        description_generated: row[11] || '',
        keywords: row[12] || '',
        banner_url: row[13] || '',
        trailer_url: row[14] || '',
        channel_name: row[15] || '',
        status: row[16] || 'pending',
        created_at: row[17] || new Date().toISOString(),
        setup_completed_at: row[18] || '',
      }));
    } catch (error) {
      console.error('❌ Error getting all clients:', error);
      throw error;
    }
  }

  /**
   * Get a single client by ID
   */
  async getClientById(clientId: string): Promise<ClientData | null> {
    try {
      const clients = await this.getAllClients();
      return clients.find((c) => c.id === clientId) || null;
    } catch (error) {
      console.error('❌ Error getting client by ID:', error);
      throw error;
    }
  }

  /**
   * Update client with partial data
   */
  async updateClient(clientId: string, updates: Partial<ClientData>): Promise<void> {
    try {
      const clients = await this.getClients();
      const rowIndex = clients.findIndex((row) => row[0] === clientId);

      if (rowIndex === -1) {
        throw new Error(`Client ${clientId} not found`);
      }

      const rowNumber = rowIndex + 2; // +2 for header row and 0-index

      // Map updates to column letters
      const columnMap: { [key: string]: string } = {
        youtube_channel_id: 'I',
        youtube_channel_title: 'J',
        youtube_channel_url: 'K',
        description_generated: 'L',
        keywords: 'M',
        banner_url: 'N',
        trailer_url: 'O',
        channel_name: 'P',
        status: 'Q',
        setup_completed_at: 'S',
      };

      // Update each field
      const updatePromises = Object.entries(updates).map(([key, value]) => {
        const column = columnMap[key];
        if (!column) return Promise.resolve();

        return this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `Clients!${column}${rowNumber}`,
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [[value]],
          },
        });
      });

      await Promise.all(updatePromises);
      console.log(`✅ Updated client ${clientId}`);
    } catch (error) {
      console.error('❌ Error updating client:', error);
      throw error;
    }
  }
}
