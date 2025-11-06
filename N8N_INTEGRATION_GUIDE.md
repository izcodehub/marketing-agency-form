# n8n Integration Guide - Marketing Agency Automation

This guide shows you exactly how to set up your n8n workflow to automate the entire process from form submission to channel setup.

---

## 📋 Overview

When a client submits the form, here's what happens:

```
Form Submission
    ↓
Backend API
    ↓
Google Sheets (client data saved)
    ↓
n8n Webhook Triggered
    ↓
AI generates: channel name, description, keywords
    ↓
HeyGen creates trailer video
    ↓
DALL-E creates banner
    ↓
Assets saved to Google Drive
    ↓
Google Sheets updated with assets
    ↓
Email sent to YOU
    ↓
YOU create channel manually (2 min)
    ↓
YOU paste channel ID in dashboard
    ↓
Backend automatically sets up channel
    ↓
Client receives confirmation email
```

---

## 🔧 n8n Workflow Setup

### Step 1: Create New Workflow

1. Login to your n8n: `https://n8n.srv1092640.hstgr.cloud`
2. Click "Create Workflow"
3. Name it: "Marketing Agency - Channel Creation"

---

### Step 2: Add Webhook Trigger

**Node 1: Webhook**

1. Add node → **Trigger** → **Webhook**
2. Configure:
   - **HTTP Method**: POST
   - **Path**: `marketing-channel-create` (or your choice)
   - **Response Mode**: "On Received"
   - **Response Code**: 200

3. **Save** and copy the webhook URL
   - It will look like: `https://n8n.srv1092640.hstgr.cloud/webhook/marketing-channel-create`

4. Update your backend `.env` file:
   ```bash
   N8N_WEBHOOK_URL=http://n8n:5678/webhook/marketing-channel-create
   ```

**Test the webhook:**
```bash
curl -X POST https://n8n.srv1092640.hstgr.cloud/webhook/marketing-channel-create \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "test-123",
    "companyName": "Test Corp",
    "industry": "Technology",
    "mission": "Help businesses grow",
    "targetAudience": "Small businesses",
    "email": "test@example.com"
  }'
```

---

### Step 3: Generate Channel Details with OpenAI

**Node 2: OpenAI (Chat)**

1. Add node → **OpenAI** → **Chat**
2. Configure:
   - **Credential**: Add your OpenAI API key
   - **Model**: gpt-4 (or gpt-3.5-turbo for cheaper)
   - **Prompt**:

```
You are a YouTube channel strategist. Create compelling channel details.

Company: {{ $json.companyName }}
Industry: {{ $json.industry }}
Mission: {{ $json.mission }}
Target Audience: {{ $json.targetAudience }}

Generate:
1. Channel Name (catchy, memorable, 3-5 words)
2. Channel Description (compelling, 150-200 words, includes mission and value)
3. Keywords (10-15 relevant keywords, comma-separated)
4. Channel Tagline (one sentence, under 100 characters)
5. Trailer Script (30-second script, engaging, explains value)

Format as JSON:
{
  "channelName": "...",
  "description": "...",
  "keywords": "...",
  "tagline": "...",
  "trailerScript": "..."
}
```

   - **Options** → Enable "JSON Output"

---

### Step 4: Parse AI Response

**Node 3: Code (Parse JSON)**

1. Add node → **Code**
2. **Mode**: Run Once for All Items
3. **Code**:

```javascript
// Extract the AI response
const aiResponse = items[0].json.choices[0].message.content;

// Parse JSON from AI response
let channelData;
try {
  // Sometimes AI wraps in markdown code blocks
  const jsonMatch = aiResponse.match(/```json\n([\s\S]*?)\n```/) ||
                    aiResponse.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : aiResponse;
  channelData = JSON.parse(jsonStr);
} catch (error) {
  // Fallback parsing
  channelData = {
    channelName: items[0].json.companyName + " Marketing",
    description: items[0].json.mission,
    keywords: items[0].json.industry,
    tagline: "Welcome to " + items[0].json.companyName,
    trailerScript: "Welcome! Subscribe for great content."
  };
}

// Combine original data with AI-generated data
return [{
  json: {
    ...items[0].json,
    ...channelData
  }
}];
```

---

### Step 5: Generate Banner with DALL-E

**Node 4: OpenAI (Image)**

1. Add node → **OpenAI** → **Image**
2. Configure:
   - **Resource**: Create an Image
   - **Model**: dall-e-3
   - **Prompt**:

```
Professional YouTube channel banner for {{ $json.channelName }}.
Industry: {{ $json.industry }}.
Style: Modern, clean, professional.
Include: Company branding, {{$json.tagline }}.
Dimensions: 2560x1440 pixels.
Color scheme: Professional and eye-catching.
No text overlays (will be added separately).
```

   - **Size**: 1792x1024 (closest to YouTube banner ratio)
   - **Quality**: hd

---

### Step 6: Download and Save Banner

**Node 5: HTTP Request (Download Banner)**

1. Add node → **HTTP Request**
2. Configure:
   - **Method**: GET
   - **URL**: `{{ $json.data[0].url }}`
   - **Response Format**: File
   - **Output Binary Data**:  Yes

**Node 6: Google Drive (Upload Banner)**

1. Add node → **Google Drive** → **Upload**
2. Configure:
   - **Credential**: Add your Google OAuth2
   - **Binary Property**: data
   - **File Name**: `{{ $json.channelName }}-banner.png`
   - **Parent Folder**: Create folder "Marketing Channels"
   - **Options** → **Convert to Google Docs**: No

3. Get shareable link:
   - Add another Google Drive node
   - **Operation**: **Share**
   - **File ID**: `{{ $json.id }}`
   - **Permissions**: Anyone with link can view

---

### Step 7: Generate Trailer with HeyGen

**Node 7: HTTP Request (HeyGen API)**

1. Add node → **HTTP Request**
2. Configure:
   - **Method**: POST
   - **URL**: `https://api.heygen.com/v2/video/generate`
   - **Authentication**: Header Auth
     - **Name**: `X-Api-Key`
     - **Value**: `YOUR_HEYGEN_API_KEY`
   - **Body Content Type**: JSON
   - **Body**:

```json
{
  "video_inputs": [{
    "character": {
      "type": "avatar",
      "avatar_id": "default_avatar_id",
      "avatar_style": "normal"
    },
    "voice": {
      "type": "text",
      "input_text": "{{ $json.trailerScript }}",
      "voice_id": "professional_male_voice"
    }
  }],
  "dimension": {
    "width": 1920,
    "height": 1080
  },
  "test": false
}
```

**Node 8: Wait for Video (Loop)**

HeyGen videos take 1-2 minutes to generate:

1. Add node → **Wait**
2. **Wait**: 30 seconds

3. Add node → **HTTP Request** (Check status)
   - **URL**: `https://api.heygen.com/v1/video_status.get?video_id={{ $json.data.video_id }}`
   - **Headers**: Same as above

4. Add node → **IF** (Check if complete)
   - **Condition**: `{{ $json.data.status }}` equals `completed`
   - **TRUE**: Continue
   - **FALSE**: Loop back to Wait node

**Node 9: Download Trailer Video**

1. Add node → **HTTP Request**
2. Configure:
   - **URL**: `{{ $json.data.video_url }}`
   - **Response Format**: File

**Node 10: Upload to Google Drive**

Similar to banner upload, save trailer video.

---

### Step 8: Update Google Sheets

**Node 11: Google Sheets (Update)**

1. Add node → **Google Sheets** → **Update**
2. Configure:
   - **Spreadsheet**: Your marketing clients sheet
   - **Range**: Look up row by Client ID
   - **Data to Set**:

```
Channel Name: {{ $json.channelName }}
Description: {{ $json.description }}
Keywords: {{ $json.keywords }}
Tagline: {{ $json.tagline }}
Banner URL: {{ $json.bannerUrl }}
Trailer URL: {{ $json.trailerUrl }}
Status: ready_for_creation
```

---

### Step 9: Send Notification Email

**Node 12: Email (Send to You)**

1. Add node → **Send Email**
2. Configure:
   - **To**: `your@email.com`
   - **Subject**: `New Channel Ready - {{ $json.companyName }}`
   - **Email Type**: HTML
   - **Body**:

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #667eea; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f7f7f7; padding: 20px; }
    .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
    .info { background: white; padding: 15px; margin: 15px 0; border-radius: 6px; }
    .label { font-weight: bold; color: #667eea; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🎥 New Channel Ready for Creation</h2>
    </div>
    <div class="content">
      <div class="info">
        <p><span class="label">Company:</span> {{ $json.companyName }}</p>
        <p><span class="label">Industry:</span> {{ $json.industry }}</p>
        <p><span class="label">Channel Name:</span> {{ $json.channelName }}</p>
      </div>

      <h3>📋 Next Steps:</h3>
      <ol>
        <li>Click "Create Channel" below</li>
        <li>Use the channel name: <strong>{{ $json.channelName }}</strong></li>
        <li>Complete any verification</li>
        <li>Copy the Channel ID</li>
        <li>Paste it in the dashboard</li>
      </ol>

      <p style="text-align: center; margin: 30px 0;">
        <a href="https://www.youtube.com/create_channel" class="button">Create Channel on YouTube</a>
        <a href="https://marketing.officepark.online/admin" class="button">Open Dashboard</a>
      </p>

      <div class="info">
        <h4>📝 Generated Content:</h4>
        <p><strong>Description:</strong><br>{{ $json.description }}</p>
        <p><strong>Keywords:</strong><br>{{ $json.keywords }}</p>
        <p><strong>Tagline:</strong><br>{{ $json.tagline }}</p>
      </div>

      <div class="info">
        <h4>🎨 Assets:</h4>
        <p><a href="{{ $json.bannerUrl }}">View Banner</a></p>
        <p><a href="{{ $json.trailerUrl }}">View Trailer Video</a></p>
      </div>

      <p><small>Client ID: {{ $json.clientId }}</small></p>
    </div>
  </div>
</body>
</html>
```

---

### Step 10: Send Push Notification (Optional - ntfy.sh)

**Node 13: HTTP Request (ntfy.sh)**

1. Add node → **HTTP Request**
2. Configure:
   - **Method**: POST
   - **URL**: `https://ntfy.sh/officepark-marketing`
   - **Body Content Type**: JSON
   - **Body**:

```json
{
  "topic": "officepark-marketing",
  "title": "New Channel Ready",
  "message": "{{ $json.companyName }} - Click to open dashboard",
  "click": "https://marketing.officepark.online/admin",
  "tags": ["sparkles"],
  "priority": 4
}
```

**To receive notifications:**
1. Install ntfy app on your phone (iOS/Android)
2. Subscribe to topic: `officepark-marketing`
3. Get instant push notifications!

---

## 🔐 OAuth2 Setup (One-Time)

Before the workflow can work, you need to authorize your Google account:

### 1. Get Authorization URL

```bash
curl http://localhost:3001/api/admin/oauth/url
```

Response:
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### 2. Authorize

1. Open the `authUrl` in your browser
2. Login with your Google account (the one that will own the channels)
3. Approve all permissions
4. Copy the authorization code

### 3. Exchange Code for Tokens

```bash
curl -X POST http://localhost:3001/api/admin/oauth/callback \
  -H "Content-Type: application/json" \
  -d '{"code": "YOUR_AUTHORIZATION_CODE"}'
```

Response:
```json
{
  "success": true,
  "message": "Authorization successful!"
}
```

**Tokens are now saved** in `/opt/marketing-agency-form/server/tokens.json`

---

## 🎬 Complete n8n Workflow Summary

```
1. Webhook Trigger
2. OpenAI Chat (generate channel details)
3. Code (parse JSON response)
4. OpenAI Image (generate banner)
5. HTTP Request (download banner)
6. Google Drive (upload banner)
7. Google Drive (share banner)
8. HTTP Request (create HeyGen video)
9. Wait (30 seconds)
10. HTTP Request (check video status)
11. IF (video complete?)
12. HTTP Request (download video)
13. Google Drive (upload video)
14. Google Sheets (update with all data)
15. Email (notify you)
16. ntfy.sh (push notification)
```

---

## 💰 Cost Estimate Per Client

```
OpenAI GPT-4: ~$0.10 (description/keywords)
DALL-E 3: ~$0.04 (banner)
HeyGen: ~$2.00 (60-second video)
Google Drive: Free
Google Sheets: Free
ntfy.sh: Free
Email: Free

Total per client: ~$2.15
```

---

## 🧪 Testing the Workflow

### Test 1: Submit Form

Go to `https://marketing.officepark.online` and submit a test:

```
Company Name: Test Company
Industry: Technology
Mission: Help businesses grow with AI
Target Audience: Small business owners
Posting Frequency: Daily
Email: test@example.com
Phone: 555-1234
```

### Test 2: Check n8n Executions

1. Go to n8n → Executions
2. You should see your workflow running
3. Watch each node complete
4. Check for errors

### Test 3: Verify Outputs

1. **Google Sheets**: New row added
2. **Google Drive**: Banner and video uploaded
3. **Email**: You received notification
4. **Phone**: ntfy.sh push received

---

## 🐛 Troubleshooting

### Webhook not triggering:
```bash
# Check n8n is running
docker ps | grep n8n

# Check webhook URL in backend
cat /opt/marketing-agency-form/server/.env | grep N8N_WEBHOOK

# Test webhook directly
curl -X POST https://n8n.srv1092640.hstgr.cloud/webhook/marketing-channel-create \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### OpenAI errors:
- Check API key is valid
- Check you have credits
- Try gpt-3.5-turbo instead of gpt-4

### HeyGen errors:
- Check API key
- Verify avatar ID exists
- Check credit balance

### Google Drive errors:
- Re-authenticate OAuth
- Check folder permissions
- Verify file size limits

---

## 📊 Monitoring & Analytics

**n8n provides:**
- Execution history
- Error logs
- Success/failure rates
- Execution times

**Track in Google Sheets:**
- Add columns for: execution_time, ai_cost, heygen_cost
- Use formulas to calculate total costs
- Monitor success rates

---

## 🔄 Daily Content Automation (Future)

Once channels are set up, create a second workflow:

```
1. Schedule Trigger (daily at 9 AM)
2. Google Sheets (get active channels)
3. OpenAI (generate video script)
4. HeyGen (create video)
5. YouTube Upload (via API)
6. Google Sheets (update last_post_date)
```

---

## ✅ Deployment Checklist

- [ ] n8n workflow created and tested
- [ ] Webhook URL configured in backend
- [ ] OAuth2 authorized (tokens.json exists)
- [ ] OpenAI API key added
- [ ] HeyGen API key added
- [ ] Google Drive connected
- [ ] Email configured
- [ ] ntfy.sh topic subscribed
- [ ] Test form submission successful
- [ ] Test email received
- [ ] Test assets in Google Drive
- [ ] Test dashboard shows pending channel

---

**You're ready to automate! 🚀**

When a client submits the form, you'll get an email and push notification in ~2-3 minutes with everything ready for channel creation!
