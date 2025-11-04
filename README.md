# AI Marketing Agency - YouTube Automation Platform

A complete automation platform for creating and managing YouTube channels with AI-generated content.

## 🏗️ Architecture

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   React     │─────▶│   Node.js   │─────▶│   Google    │
│   Form      │      │   Backend   │      │   APIs      │
└─────────────┘      └─────────────┘      └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │     n8n     │
                     │  Workflow   │
                     └─────────────┘
```

## 📁 Project Structure

```
marketing-agency-form/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ClientOnboardingForm.tsx
│   │   │   └── ClientOnboardingForm.css
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── index.tsx
│   │   └── index.css
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   └── tsconfig.json
│
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── routes/
│   │   │   └── onboard.ts
│   │   ├── services/
│   │   │   ├── googleSheets.ts
│   │   │   └── youtube.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── package.json            # Root package file
└── README.md              # This file
```

## 🚀 Quick Start Guide

### Prerequisites

- Node.js 18+ installed
- Google Cloud Platform account
- Google Workspace account (for YouTube brand channels)
- n8n instance (hosted on Hostinger or elsewhere)

### Step 1: Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Return to root
cd ..
```

### Step 2: Set Up Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable these APIs:
   - YouTube Data API v3
   - Google Sheets API
4. Create a Service Account:
   - Go to "IAM & Admin" → "Service Accounts"
   - Click "Create Service Account"
   - Name it (e.g., "marketing-automation")
   - Grant it "Editor" role
   - Create a JSON key and download it
5. Copy the email and private key from the JSON file

### Step 3: Set Up Google Sheets

1. Create a new Google Sheet
2. Name the first sheet "Clients"
3. Add these column headers in row 1:
   ```
   id | client_name | industry | description_input | target_audience |
   posting_frequency | email | phone | youtube_channel_id |
   youtube_channel_title | youtube_channel_url | description |
   keywords | banner_tagline | trailer_script | status | errors | created_at
   ```
4. Share the sheet with your service account email (from Step 2)
5. Copy the Spreadsheet ID from the URL

### Step 4: Configure Environment Variables

#### Server Environment (.env)

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
PORT=3001
NODE_ENV=development

# From Google Cloud Console → Service Account JSON
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key-Here\n-----END PRIVATE KEY-----\n"

# From Google Sheets URL
GOOGLE_SHEETS_SPREADSHEET_ID=1o6ktY3yJwJ9qff2Kd-hgjwsJ8V0f-hYFyn1vFXT9O_o

# Your YouTube channel ID (for now, use existing channel)
YOUTUBE_MASTER_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxx

# Optional: Your n8n webhook URL
N8N_WEBHOOK_URL=https://your-n8n.hostinger.com/webhook/client-onboarding
```

#### Client Environment (.env)

```bash
cd ../client
cp .env.example .env
```

Edit `client/.env`:

```env
REACT_APP_API_URL=http://localhost:3001
```

### Step 5: Run the Application

#### Option A: Run Both (Development)

From the root directory:

```bash
npm run dev
```

This will start:
- Backend server on http://localhost:3001
- React app on http://localhost:3000

#### Option B: Run Separately

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

### Step 6: Test the Form

1. Open http://localhost:3000 in your browser
2. Fill out the form with test data
3. Submit and check:
   - Browser console for any errors
   - Terminal logs for backend activity
   - Google Sheets for new row
   - n8n workflow execution (if configured)

## 🔧 Configuration

### TypeScript Explained

TypeScript is JavaScript with types. It helps catch errors before running code:

```typescript
// JavaScript (no types)
function greet(name) {
  return "Hello " + name;
}

// TypeScript (with types)
function greet(name: string): string {
  return "Hello " + name;
}
```

### Key Files Explained

**`server/src/index.ts`**
- Main server entry point
- Sets up Express web server
- Configures middleware (CORS, JSON parsing)
- Defines routes

**`server/src/routes/onboard.ts`**
- Handles form submission
- Creates YouTube channel
- Saves to Google Sheets
- Triggers n8n workflow

**`server/src/services/googleSheets.ts`**
- Connects to Google Sheets API
- Adds client data
- Updates client status

**`server/src/services/youtube.ts`**
- Connects to YouTube API
- Creates/manages channels
- Uploads videos

**`client/src/components/ClientOnboardingForm.tsx`**
- React component for the form
- Handles user input
- Validates data
- Sends to backend API

## 🔗 Integrating with n8n

### Update Your n8n Workflow

1. **Change Trigger** (Replace "Manual Trigger"):
   - Add "Webhook" node
   - Set method to "POST"
   - Copy the webhook URL
   - Add it to your `server/.env` as `N8N_WEBHOOK_URL`

2. **Remove "Get row(s) in sheet"** node:
   - The data now comes from the webhook payload

3. **Update subsequent nodes** to use webhook data:
   ```
   {{ $json.companyName }}
   {{ $json.industry }}
   {{ $json.channelId }}
   ```

### Example n8n Webhook Node Configuration

```json
{
  "httpMethod": "POST",
  "path": "client-onboarding",
  "responseMode": "onReceived"
}
```

## 🎨 Customizing the Form

### Add New Fields

1. **Update Form Interface** (`client/src/components/ClientOnboardingForm.tsx`):
```typescript
interface FormData {
  companyName: string;
  industry: string;
  // Add new field:
  website: string;
}
```

2. **Add to State**:
```typescript
const [formData, setFormData] = useState<FormData>({
  companyName: '',
  industry: '',
  website: '', // Add here
});
```

3. **Add Input Field** in JSX:
```tsx
<div className="form-group">
  <label htmlFor="website">Website</label>
  <input
    type="url"
    id="website"
    name="website"
    value={formData.website}
    onChange={handleChange}
  />
</div>
```

4. **Update Backend** (`server/src/routes/onboard.ts`):
```typescript
interface OnboardRequest {
  companyName: string;
  industry: string;
  website: string; // Add here
}
```

## 📊 YouTube Channel Creation - Important Note

⚠️ **Current Limitation**: YouTube API doesn't support creating channels programmatically with service accounts.

### Current Workaround (MVP):
- Form creates record in Google Sheets
- Returns a placeholder channel
- You manually create channels and update the records

### Future Solution:
Implement OAuth2 flow to create real brand accounts:

1. Set up OAuth2 credentials in Google Cloud
2. Implement OAuth2 callback route
3. Store OAuth tokens securely
4. Use tokens to create brand channels

See `server/src/services/youtube.ts` comments for more details.

## 🚀 Deployment

### Deploy Backend (Node.js)

**Hostinger VPS:**
```bash
# SSH into your server
ssh root@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Clone your code
git clone your-repo-url
cd marketing-agency-form/server

# Install dependencies
npm install

# Build TypeScript
npm run build

# Install PM2 for process management
npm install -g pm2

# Start server
pm2 start dist/index.js --name marketing-api
pm2 save
pm2 startup
```

### Deploy Frontend (React)

**Option 1: Hostinger (same server)**
```bash
cd ../client
npm install
npm run build

# Copy build to web root
cp -r build/* /var/www/html/
```

**Option 2: Netlify (recommended)**
1. Connect GitHub repo
2. Build command: `cd client && npm run build`
3. Publish directory: `client/build`
4. Update `REACT_APP_API_URL` to production backend URL

### Environment Variables in Production

Update `.env` files with production values:
- Use HTTPS URLs
- Use production Google Sheets
- Configure CORS to allow your domain

## 🐛 Troubleshooting

### "Module not found" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### TypeScript errors
```bash
# Rebuild TypeScript
npm run build
```

### Google API authentication fails
- Check service account email is correct
- Verify private key has `\n` preserved
- Ensure sheet is shared with service account

### CORS errors
- Check backend CORS configuration in `server/src/index.ts`
- Verify `REACT_APP_API_URL` is correct

## 📚 Learning Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [n8n Documentation](https://docs.n8n.io/)

## 🔐 Security Notes

- Never commit `.env` files
- Keep service account keys secure
- Use environment variables for all secrets
- Implement rate limiting in production
- Add authentication for admin routes
- Validate all user inputs

## 📝 Next Steps

1. ✅ Set up Google Cloud credentials
2. ✅ Configure environment variables
3. ✅ Test form submission locally
4. ⏳ Implement real YouTube OAuth2 flow
5. ⏳ Add banner generation (DALL-E)
6. ⏳ Add video generation (D-ID, Synthesia, or Runway)
7. ⏳ Set up automated daily posting
8. ⏳ Add payment integration (Stripe)
9. ⏳ Deploy to production

## 🆘 Need Help?

Check the logs:
```bash
# Backend logs (if using PM2)
pm2 logs marketing-api

# Development logs
# Just check the terminal where you ran npm run dev
```

---

Built with ❤️ using React, Node.js, TypeScript, and n8n
