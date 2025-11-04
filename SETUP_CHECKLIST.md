# Setup Checklist - AI Marketing Agency Platform

Use this checklist to set up your marketing automation platform step by step.

## ✅ Phase 1: Initial Setup (30 minutes)

### 1.1 Install Software
- [ ] Install Node.js 18+ from https://nodejs.org/
- [ ] Verify installation: `node --version` (should show v18 or higher)
- [ ] Verify npm: `npm --version`

### 1.2 Download & Install Project
- [ ] Navigate to project folder: `cd /Users/bizou/marketing-agency-form`
- [ ] Install root dependencies: `npm install`
- [ ] Install server dependencies: `cd server && npm install`
- [ ] Install client dependencies: `cd ../client && npm install`
- [ ] Return to root: `cd ..`

## ✅ Phase 2: Google Cloud Setup (20 minutes)

### 2.1 Create Google Cloud Project
- [ ] Go to https://console.cloud.google.com/
- [ ] Click "Select a Project" → "New Project"
- [ ] Name: "Marketing Agency Automation"
- [ ] Click "Create"
- [ ] Wait for project creation

### 2.2 Enable APIs
- [ ] In search bar, type "YouTube Data API v3"
- [ ] Click "Enable"
- [ ] Go back, search "Google Sheets API"
- [ ] Click "Enable"

### 2.3 Create Service Account
- [ ] Go to "IAM & Admin" → "Service Accounts"
- [ ] Click "Create Service Account"
- [ ] Name: `marketing-automation`
- [ ] Description: "Service account for YouTube and Sheets automation"
- [ ] Click "Create and Continue"
- [ ] Role: Select "Editor"
- [ ] Click "Continue" → "Done"

### 2.4 Generate Service Account Key
- [ ] Click on the service account you just created
- [ ] Go to "Keys" tab
- [ ] Click "Add Key" → "Create new key"
- [ ] Select "JSON"
- [ ] Click "Create" (file will download)
- [ ] Open the JSON file
- [ ] Copy the `client_email` value (looks like `name@project.iam.gserviceaccount.com`)
- [ ] Copy the `private_key` value (starts with `-----BEGIN PRIVATE KEY-----`)

## ✅ Phase 3: Google Sheets Setup (10 minutes)

### 3.1 Create Database Sheet
- [ ] Go to https://sheets.google.com/
- [ ] Click "Blank" to create new sheet
- [ ] Rename sheet to "AI Marketing Agency DB"
- [ ] Rename the tab (bottom) to "Clients"

### 3.2 Add Column Headers
Copy and paste these headers into row 1 (columns A through R):

```
id	client_name	industry	description_input	target_audience	posting_frequency	email	phone	youtube_channel_id	youtube_channel_title	youtube_channel_url	description	keywords	banner_tagline	trailer_script	status	errors	created_at
```

- [ ] Paste headers in row 1
- [ ] Make row 1 bold
- [ ] Freeze row 1 (View → Freeze → 1 row)

### 3.3 Share with Service Account
- [ ] Click "Share" button (top right)
- [ ] Paste your service account email from step 2.4
- [ ] Change permission to "Editor"
- [ ] Uncheck "Notify people"
- [ ] Click "Share"

### 3.4 Get Spreadsheet ID
- [ ] Look at URL: `https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit`
- [ ] Copy the SPREADSHEET_ID part
- [ ] Save it for the next step

## ✅ Phase 4: YouTube Setup (10 minutes)

### 4.1 Get Your Channel ID
- [ ] Go to https://studio.youtube.com/
- [ ] Click your profile picture → "Settings"
- [ ] Click "Advanced settings"
- [ ] Copy your "Channel ID" (starts with UC...)
- [ ] Save it for the next step

### 4.2 Plan Channel Creation Strategy
For MVP, you have two options:

**Option A: Manual (easiest for MVP)**
- [ ] You'll manually create brand channels for each client
- [ ] Your backend will just record the channel info

**Option B: Automated (requires OAuth2)**
- [ ] Requires implementing OAuth2 flow
- [ ] See README.md for implementation guide
- [ ] Recommended for after MVP

## ✅ Phase 5: Environment Configuration (10 minutes)

### 5.1 Configure Server Environment
- [ ] Navigate to server folder: `cd server`
- [ ] Copy example: `cp .env.example .env`
- [ ] Open `server/.env` in a text editor
- [ ] Fill in these values:

```env
PORT=3001
NODE_ENV=development

# Paste from step 2.4:
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Paste from step 3.4:
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id

# Paste from step 4.1:
YOUTUBE_MASTER_CHANNEL_ID=UCxxxxxxxxxxxxx

# Leave empty for now (we'll add n8n later):
N8N_WEBHOOK_URL=
```

- [ ] Save the file

### 5.2 Configure Client Environment
- [ ] Navigate to client folder: `cd ../client`
- [ ] Copy example: `cp .env.example .env`
- [ ] Open `client/.env`
- [ ] Verify it contains:

```env
REACT_APP_API_URL=http://localhost:3001
```

- [ ] Save the file

## ✅ Phase 6: First Test Run (5 minutes)

### 6.1 Start the Application
- [ ] Open terminal and navigate to root: `cd /Users/bizou/marketing-agency-form`
- [ ] Run: `npm run dev`
- [ ] Wait for both servers to start
- [ ] You should see:
  - "Server running on http://localhost:3001"
  - "Compiled successfully!"

### 6.2 Test the Form
- [ ] Open browser to http://localhost:3000
- [ ] You should see the form with purple gradient background
- [ ] Fill out all fields with test data:
  - Company Name: "Test Company"
  - Industry: "Technology"
  - Mission: "We are testing the automation platform to see how it works with our marketing strategy"
  - Target Audience: "Small business owners aged 30-50 in North America"
  - Posting Frequency: Daily
  - Email: your-email@example.com
  - Phone: +1 555-123-4567
- [ ] Click "Start Free Trial"

### 6.3 Verify Success
- [ ] Form should show success message
- [ ] Check terminal for logs:
  - "📝 New onboarding request: Test Company"
  - "✅ YouTube channel created"
  - "✅ Client saved to Google Sheets"
- [ ] Open Google Sheets
- [ ] Verify new row was added with your test data

## ✅ Phase 7: n8n Integration (15 minutes)

### 7.1 Update n8n Workflow
- [ ] Open your n8n instance
- [ ] Open your workflow
- [ ] Delete "Manual Trigger" node
- [ ] Add "Webhook" node:
  - HTTP Method: POST
  - Path: `client-onboarding`
  - Response Mode: "On Received"
- [ ] Copy the webhook URL (Test URL or Production URL)

### 7.2 Update Workflow to Use Webhook Data
Instead of reading from Google Sheets, use webhook data:

- [ ] Update OpenAI node prompt to use:
  - `{{ $json.companyName }}` instead of `{{ $json.client_name }}`
  - `{{ $json.industry }}` (same)
  - Keep the rest of your workflow

### 7.3 Add Webhook URL to Backend
- [ ] Open `server/.env`
- [ ] Add your n8n webhook URL:
```env
N8N_WEBHOOK_URL=https://your-n8n.hostinger.com/webhook/client-onboarding
```
- [ ] Save file
- [ ] Restart server (Ctrl+C, then `npm run dev`)

### 7.4 Test End-to-End
- [ ] Submit another test form
- [ ] Check n8n workflow executions
- [ ] Verify workflow triggered automatically
- [ ] Verify OpenAI generated channel branding
- [ ] Verify YouTube channel updated

## ✅ Phase 8: Production Deployment (Optional)

### 8.1 Deploy Backend
See README.md "Deployment" section for:
- [ ] Hostinger VPS setup
- [ ] PM2 process manager
- [ ] Domain configuration

### 8.2 Deploy Frontend
- [ ] Build for production: `npm run build`
- [ ] Deploy to Netlify or Hostinger
- [ ] Update environment variables

### 8.3 Update DNS
- [ ] Point domain to your backend
- [ ] Update CORS settings
- [ ] Update `REACT_APP_API_URL`

## 🎯 Success Criteria

You know everything is working when:

✅ Form loads without errors
✅ Form submission shows success message
✅ New row appears in Google Sheets
✅ n8n workflow executes automatically
✅ Channel branding is generated by AI
✅ Terminal shows no errors

## 🚨 Common Issues

### Issue: "Module not found"
**Solution:**
```bash
rm -rf node_modules
npm install
```

### Issue: Google API authentication fails
**Solution:**
- Verify service account email in .env
- Check private key has `\n` preserved (keep the quotes!)
- Confirm sheet is shared with service account

### Issue: Form shows "Failed to submit"
**Solution:**
- Check terminal for error messages
- Verify backend is running (http://localhost:3001/health should work)
- Check browser console for errors
- Verify CORS is enabled

### Issue: n8n workflow not triggering
**Solution:**
- Verify webhook URL is correct in .env
- Check n8n execution logs
- Test webhook manually with curl:
```bash
curl -X POST https://your-n8n.com/webhook/client-onboarding \
  -H "Content-Type: application/json" \
  -d '{"companyName":"Test","industry":"Tech","channelId":"UC123"}'
```

## 📚 Next Steps After Setup

1. [ ] Read the full README.md
2. [ ] Understand the code structure
3. [ ] Customize the form for your needs
4. [ ] Add banner generation (DALL-E API)
5. [ ] Add video generation (D-ID, Synthesia, etc.)
6. [ ] Set up scheduled posting
7. [ ] Add payment integration
8. [ ] Deploy to production

## 💡 Tips for Learning TypeScript

If you're new to TypeScript, focus on:

1. **Interfaces** = Data shapes
```typescript
interface User {
  name: string;
  age: number;
}
```

2. **Types for function parameters**
```typescript
function greet(name: string): string {
  return "Hello " + name;
}
```

3. **Optional properties** with `?`
```typescript
interface Config {
  required: string;
  optional?: number;
}
```

Start with the form component to see these in action!

---

**Need help?** Check the logs and README.md troubleshooting section.

**Questions?** Review the code comments - they explain what each part does.
