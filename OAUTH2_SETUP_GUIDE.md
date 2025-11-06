# OAuth2 Setup Guide - Google Cloud Configuration

This guide walks you through setting up OAuth2 authentication so your application can manage YouTube channels under your Google account.

---

## 🎯 What You're Setting Up

**OAuth2** allows your application to:
- Manage YouTube channels you create
- Upload videos
- Update channel settings
- Set banners and trailers

All under **YOUR** Google account (not service account).

---

## 📋 Prerequisites

- Google account (the one that will own the channels)
- Access to Google Cloud Console
- Client ID and Secret (you mentioned you have these)

---

## Step 1: Verify Your OAuth2 Credentials

You mentioned you already have:
- Client ID
- Client Secret
- Configured for `https://zevlondon.app.n8n.cloud`

Let's verify and update them for our use case.

### 1.1 Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/apis/credentials
2. Select your project
3. Find your OAuth 2.0 Client ID

### 1.2 Check Authorized Redirect URIs

Your current redirect URI is for n8n. We need to add one for local/VPS:

Click **Edit** on your OAuth client:

**Add these redirect URIs:**
```
urn:ietf:wg:oauth:2.0:oob
http://localhost:3001/oauth/callback
https://api.officepark.online/oauth/callback
```

**Explanation:**
- `urn:ietf:wg:oauth:2.0:oob` - For manual code entry (recommended for server apps)
- `http://localhost:3001/oauth/callback` - For local testing
- `https://api.officepark.online/oauth/callback` - For production

Click **Save**.

---

## Step 2: Verify Required APIs are Enabled

### 2.1 Check Enabled APIs

Go to: https://console.cloud.google.com/apis/dashboard

**Required APIs:**
- ✅ YouTube Data API v3 (you have this)
- ✅ Google Sheets API (you have this)
- ✅ Google Drive API (for asset storage)

### 2.2 Enable Google Drive API (if not already)

1. Go to https://console.cloud.google.com/apis/library
2. Search for "Google Drive API"
3. Click **Enable**

---

## Step 3: Configure Your Application

### 3.1 Update Backend .env File

On your VPS at `/opt/marketing-agency-form/server/.env`:

```bash
# Google OAuth2 Credentials
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_REDIRECT_URI=urn:ietf:wg:oauth:2.0:oob

# Service Account (separate, for Sheets)
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key\n-----END PRIVATE KEY-----\n"

# Google Sheets
GOOGLE_SHEETS_SPREADSHEET_ID=your-sheet-id-here
```

**Where to find your credentials:**

**Client ID & Secret:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Copy "Client ID" and "Client secret"

**Service Account Email & Key:**
1. Go to https://console.cloud.google.com/iam-admin/serviceaccounts
2. Find your service account
3. Click **Keys** → **Add Key** → **Create New Key** → **JSON**
4. Download JSON file
5. Extract `client_email` and `private_key`

**Sheets ID:**
From your Google Sheets URL:
```
https://docs.google.com/spreadsheets/d/1AbC123XyZ_EXAMPLE/edit
                                      ^^^^^^^^^^^^^^^^
                                      This is your ID
```

---

## Step 4: Authorize Your Application (One-Time Setup)

This is a **ONE-TIME** process to grant your app permission to manage YouTube under your account.

### 4.1 SSH into Your VPS

```bash
ssh root@168.231.68.224
cd /opt/marketing-agency-form
```

### 4.2 Get Authorization URL

**Option A: Via curl**
```bash
curl http://localhost:3001/api/admin/oauth/url
```

**Option B: Via browser** (if backend is running)
```
https://api.officepark.online/api/admin/oauth/url
```

Response:
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube..."
}
```

### 4.3 Open Authorization URL

1. Copy the entire `authUrl` from the response
2. Paste it in your browser
3. **IMPORTANT**: Login with the Google account that will OWN the channels
   - This is the account where you'll create Brand Accounts
   - Channels will be created under this account

### 4.4 Grant Permissions

Google will ask for these permissions:
```
✅ View and manage your YouTube account
✅ Upload videos
✅ Manage your YouTube account settings
✅ View and manage Google Drive files
✅ View and manage Google Sheets
```

Click **Allow** / **Continue** for all.

### 4.5 Copy Authorization Code

After granting permissions, Google shows you a code:

```
4/0AfJohXliBCD...xyz123 (very long string)
```

**Copy this entire code.**

### 4.6 Exchange Code for Tokens

Back on your VPS:

```bash
curl -X POST http://localhost:3001/api/admin/oauth/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "PASTE_YOUR_CODE_HERE"}'
```

**Success response:**
```json
{
  "success": true,
  "message": "Authorization successful! You can now manage YouTube channels."
}
```

**Tokens are now saved** at:
```
/opt/marketing-agency-form/server/tokens.json
```

**⚠️ IMPORTANT:** This file contains your access tokens. Keep it secure!

---

## Step 5: Verify Authorization

### 5.1 Check OAuth Status

```bash
curl http://localhost:3001/api/admin/oauth/status
```

**Expected response:**
```json
{
  "isAuthorized": true,
  "message": "OAuth2 is configured and ready"
}
```

### 5.2 Test Channel Access

Create a test channel manually on YouTube:
1. Go to https://www.youtube.com/create_channel
2. Create a test brand account: "Test Marketing Channel"
3. Copy the Channel ID (from YouTube Studio → Settings → Channel → Advanced)

Test API access:
```bash
curl http://localhost:3001/api/admin/channel/YOUR_CHANNEL_ID
```

Should return channel information.

---

## Step 6: Token Refresh (Automatic)

**Good news:** Tokens refresh automatically!

Your `OAuth2Service` will:
- Detect when access token expires
- Automatically refresh using refresh token
- Save new tokens to `tokens.json`
- Continue working seamlessly

**Refresh tokens last:** ~6 months to forever (if used regularly)

---

## 🔐 Security Best Practices

### 1. Protect tokens.json

```bash
# On your VPS
chmod 600 /opt/marketing-agency-form/server/tokens.json
chown root:root /opt/marketing-agency-form/server/tokens.json
```

### 2. Add to .gitignore

Already done:
```
server/tokens.json
server/.env
```

### 3. Backup tokens

```bash
# Create encrypted backup
tar -czf tokens-backup.tar.gz server/tokens.json
gpg -c tokens-backup.tar.gz  # Enter a password
rm tokens-backup.tar.gz
# Store tokens-backup.tar.gz.gpg somewhere safe
```

### 4. Rotate credentials if compromised

If tokens.json is ever exposed:
1. Go to https://console.cloud.google.com/apis/credentials
2. Delete the OAuth client
3. Create a new one
4. Re-authorize following this guide

---

## 🐛 Troubleshooting

### Error: "Invalid grant"

**Cause:** Authorization code expired or already used

**Solution:**
1. Get a new authorization URL
2. Get a fresh code
3. Exchange it immediately

### Error: "Redirect URI mismatch"

**Cause:** Redirect URI not configured

**Solution:**
1. Go to Google Cloud Console
2. Add `urn:ietf:wg:oauth:2.0:oob` to authorized redirect URIs
3. Try again

### Error: "Access denied"

**Cause:** Not all permissions granted

**Solution:**
1. Revoke access: https://myaccount.google.com/permissions
2. Re-authorize and approve ALL permissions

### Error: "Token expired"

**Cause:** Access token expired and refresh failed

**Solution:**
1. Check `tokens.json` has a `refresh_token`
2. If missing, re-authorize from scratch
3. Make sure you used `access_type=offline` in auth URL

### Tokens not refreshing

**Check the logs:**
```bash
docker logs root-marketing-backend-1 | grep -i token
```

**Common cause:** `refresh_token` missing

**Solution:** Re-authorize with `prompt=consent`:
```bash
# Get URL again
curl http://localhost:3001/api/admin/oauth/url
# Follow authorization steps again
```

---

## 📊 Testing Your Setup

### Test 1: Create a Test Channel

1. Go to https://www.youtube.com/create_channel
2. Choose "Use a business or other name"
3. Enter: "Test Marketing Demo"
4. Create channel
5. Note the Channel ID

### Test 2: Use Admin Dashboard

1. Submit a test form at https://marketing.officepark.online
2. Wait for n8n to process (check email)
3. Go to https://marketing.officepark.online/admin
4. Enter password: `admin123` (change this in production!)
5. Click "Submit Channel ID" on your test client
6. Enter your test channel ID
7. Click submit

**Expected result:**
- Banner uploads
- Description updates
- Keywords set
- Status changes to "completed"

### Test 3: Verify on YouTube

1. Go to YouTube Studio
2. Check your test channel
3. Verify:
   - ✅ Description updated
   - ✅ Banner uploaded
   - ✅ Keywords set

---

## 🔄 Channel Creation Workflow

With OAuth2 set up, here's your process:

```
1. Client submits form
    ↓
2. n8n generates assets (2-3 minutes)
    ↓
3. You get email notification
    ↓
4. YOU manually create channel (2 minutes)
   - Go to YouTube
   - Create brand account
   - Use name from email
   - Complete verification if needed
   - Copy channel ID
    ↓
5. Paste channel ID in dashboard
    ↓
6. Backend AUTOMATICALLY:
   - Uploads banner
   - Sets description
   - Adds keywords
   - Uploads trailer
   - Updates Google Sheets
    ↓
7. Client receives confirmation email
```

**Your manual work:** 2 minutes per client
**Automated:** Everything else

---

## 🎓 Understanding OAuth2 Flow

**First Time (One-Time Setup):**
```
Your App
    ↓
Requests authorization URL
    ↓
You visit URL in browser
    ↓
Google login & consent
    ↓
Google gives code
    ↓
Your App exchanges code for tokens
    ↓
Tokens saved (access + refresh)
```

**Every API Request:**
```
Your App needs to upload video
    ↓
Checks if access token valid
    ↓
If expired: Use refresh token to get new access token
    ↓
Makes API request with access token
    ↓
YouTube API responds
```

---

## 🎬 You're Ready!

**Checklist:**
- ✅ OAuth client configured
- ✅ Redirect URIs added
- ✅ APIs enabled
- ✅ .env file updated
- ✅ Authorized with Google
- ✅ tokens.json created
- ✅ Tested with test channel

**Next steps:**
1. Complete n8n workflow setup (see N8N_INTEGRATION_GUIDE.md)
2. Deploy to production (see DEPLOYMENT.md)
3. Start accepting real clients!

---

## 📞 Need Help?

Common issues and solutions are in the troubleshooting section above.

For OAuth-specific errors, check:
- Google Cloud Console error logs
- Backend logs: `docker logs root-marketing-backend-1`
- tokens.json file exists and has refresh_token

---

**Happy automating! 🚀**
