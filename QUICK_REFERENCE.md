# Quick Reference Guide

## 🚀 Common Commands

### Starting the Application

```bash
# From root directory - starts both frontend and backend
npm run dev

# OR separately:

# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm start
```

### Installing Dependencies

```bash
# Root
npm install

# Server
cd server && npm install

# Client
cd client && npm install
```

### Building for Production

```bash
# Backend
cd server && npm run build

# Frontend
cd client && npm run build
```

## 📂 Project Structure Quick Map

```
marketing-agency-form/
├── client/                           # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ClientOnboardingForm.tsx    # Main form
│   │   │   └── ClientOnboardingForm.css    # Form styles
│   │   ├── App.tsx                          # Root component
│   │   ├── App.css                          # App styles
│   │   └── index.tsx                        # Entry point
│   ├── public/
│   │   └── index.html                       # HTML template
│   └── .env                                 # Frontend config

├── server/                           # Node.js Backend
│   ├── src/
│   │   ├── index.ts                         # Server entry point
│   │   ├── routes/
│   │   │   └── onboard.ts                   # API endpoint
│   │   └── services/
│   │       ├── googleSheets.ts              # Sheets integration
│   │       └── youtube.ts                   # YouTube integration
│   └── .env                                 # Backend config (SECRETS!)

├── README.md                         # Full documentation
├── SETUP_CHECKLIST.md               # Step-by-step setup
├── UNDERSTANDING_THE_CODE.md        # Learning guide
└── QUICK_REFERENCE.md              # This file
```

## 🔧 Configuration Files

### `.env` Files

**server/.env** (Backend):
```env
PORT=3001
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=your-spreadsheet-id
YOUTUBE_MASTER_CHANNEL_ID=UCxxxxx
N8N_WEBHOOK_URL=https://your-n8n.com/webhook/client-onboarding
```

**client/.env** (Frontend):
```env
REACT_APP_API_URL=http://localhost:3001
```

### TypeScript Config

**tsconfig.json** - Tells TypeScript how to compile your code

**Key settings:**
- `target: "ES2020"` - JavaScript version to compile to
- `module: "commonjs"` - Module system
- `strict: true` - Enable strict type checking
- `outDir: "./dist"` - Where compiled JS goes

## 🌐 API Endpoints

### Backend Routes

| Method | Endpoint | Description | Request Body |
|--------|----------|-------------|--------------|
| GET | `/health` | Health check | None |
| POST | `/api/onboard` | Submit new client | FormData object |

### Request/Response Examples

**POST /api/onboard**

Request:
```json
{
  "companyName": "Acme Corp",
  "industry": "Technology",
  "mission": "We help businesses grow...",
  "targetAudience": "Small business owners...",
  "postingFrequency": "daily",
  "email": "john@acme.com",
  "phone": "+1 555-1234"
}
```

Success Response (200):
```json
{
  "success": true,
  "clientId": "uuid-123",
  "channelUrl": "https://youtube.com/channel/UC...",
  "channelId": "UCxxxxx",
  "message": "Channel created successfully"
}
```

Error Response (500):
```json
{
  "error": "Failed to process onboarding request",
  "details": "Error message here"
}
```

## 🔍 Debugging Tips

### Check Backend Health

```bash
curl http://localhost:3001/health
```

Expected response:
```json
{"status":"ok","timestamp":"2024-01-15T10:30:00.000Z"}
```

### View Backend Logs

Look at terminal where you ran `npm run dev`

Key log messages:
- `🚀 Server running on...` - Server started
- `📝 New onboarding request` - Form submitted
- `✅ YouTube channel created` - Channel created
- `✅ Client saved to Google Sheets` - Data saved
- `✅ n8n workflow triggered` - Workflow started

### Check Frontend Console

1. Open browser (Chrome/Firefox)
2. Press F12 or Cmd+Option+I (Mac)
3. Go to "Console" tab
4. Look for errors (red text)

### Common Error Messages

| Error | What it means | Fix |
|-------|---------------|-----|
| `Cannot find module 'xxx'` | Missing dependency | Run `npm install` |
| `ECONNREFUSED` | Backend not running | Start backend server |
| `CORS error` | Cross-origin blocked | Check CORS config in server/src/index.ts |
| `Failed to fetch` | Network error | Check API URL in .env |
| `Unauthorized` | Auth failed | Check Google credentials |

## 📝 TypeScript Quick Reference

### Basic Types

```typescript
let name: string = "John";
let age: number = 25;
let isActive: boolean = true;
let tags: string[] = ["tech", "business"];
```

### Interfaces

```typescript
interface User {
  name: string;
  age: number;
  email?: string;  // Optional field
}

const user: User = {
  name: "John",
  age: 25,
  // email is optional
};
```

### Functions

```typescript
function greet(name: string): string {
  return `Hello ${name}`;
}

// Arrow function
const greet = (name: string): string => {
  return `Hello ${name}`;
};

// Async function
async function fetchData(): Promise<Data> {
  const response = await fetch(url);
  return response.json();
}
```

### Type Assertions

```typescript
const element = document.getElementById('root') as HTMLElement;
```

## ⚛️ React Quick Reference

### Component Basics

```typescript
// Functional component
export const MyComponent: React.FC = () => {
  return <div>Hello</div>;
};
```

### State

```typescript
const [count, setCount] = useState<number>(0);

// Update state
setCount(5);
setCount(prev => prev + 1);
```

### Props

```typescript
interface Props {
  title: string;
  onClose: () => void;
}

export const Modal: React.FC<Props> = ({ title, onClose }) => {
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={onClose}>Close</button>
    </div>
  );
};
```

### Event Handlers

```typescript
// Form submit
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // Handle form
};

// Input change
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
};

// Click
const handleClick = () => {
  console.log('Clicked!');
};
```

## 🔐 Security Checklist

- [ ] `.env` files are in `.gitignore`
- [ ] Service account keys are not in code
- [ ] CORS is configured for your domain only
- [ ] Input validation on both frontend and backend
- [ ] API rate limiting (for production)
- [ ] HTTPS in production
- [ ] Environment variables set on hosting platform

## 🐛 Troubleshooting Flowchart

```
Form submission fails?
│
├─ Frontend shows error?
│  ├─ Yes → Check browser console
│  │        └─ Network error? → Backend not running
│  └─ No → Check backend logs
│
├─ Backend shows error?
│  ├─ "Module not found" → npm install
│  ├─ "Environment variable not set" → Check .env file
│  ├─ "Google API error" → Check credentials
│  └─ "Failed to fetch" → Check API URL
│
└─ No errors but not working?
   └─ Add console.log statements everywhere
      └─ Follow data flow step by step
```

## 📊 Google Sheets Column Reference

| Column | Field Name | Description | Filled By |
|--------|-----------|-------------|-----------|
| A | id | Unique client ID | Backend |
| B | client_name | Company name | Backend |
| C | industry | Industry type | Backend |
| D | description_input | Company mission | Backend |
| E | target_audience | Target audience | Backend |
| F | posting_frequency | Post frequency | Backend |
| G | email | Contact email | Backend |
| H | phone | Phone number | Backend |
| I | youtube_channel_id | YouTube channel ID | Backend |
| J | youtube_channel_title | Channel title | Backend |
| K | youtube_channel_url | Channel URL | Backend |
| L | description | AI-generated description | n8n |
| M | keywords | AI-generated keywords | n8n |
| N | banner_tagline | Banner text | n8n |
| O | trailer_script | Video script | n8n |
| P | status | Client status | Backend |
| Q | errors | Error messages | System |
| R | created_at | Creation timestamp | Backend |

## 🔄 n8n Workflow Integration

### Webhook Configuration

1. Replace "Manual Trigger" with "Webhook"
2. Set HTTP Method to POST
3. Set path to `client-onboarding`
4. Copy webhook URL
5. Add to `server/.env` as `N8N_WEBHOOK_URL`

### Webhook Payload

Your n8n workflow receives:
```json
{
  "clientId": "uuid-123",
  "channelId": "UCxxxxx",
  "companyName": "Acme Corp",
  "industry": "Technology"
}
```

Access in n8n nodes:
- `{{ $json.clientId }}`
- `{{ $json.channelId }}`
- `{{ $json.companyName }}`
- `{{ $json.industry }}`

## 🚀 Deployment Quick Reference

### Backend (Hostinger VPS)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Clone and setup
git clone your-repo
cd marketing-agency-form/server
npm install
npm run build

# Start with PM2
npm install -g pm2
pm2 start dist/index.js --name marketing-api
pm2 save
pm2 startup
```

### Frontend (Netlify)

1. Connect GitHub repo
2. Build command: `cd client && npm run build`
3. Publish directory: `client/build`
4. Environment variables:
   - `REACT_APP_API_URL=https://your-api.com`

### Environment Variables in Production

Update in hosting platform dashboard:
- Netlify: Site settings → Environment variables
- Hostinger: Create `.env` file on server
- Never commit production `.env` files!

## 📞 Testing Checklist

- [ ] Form loads without errors
- [ ] All fields are editable
- [ ] Validation works (try submitting empty form)
- [ ] Submit button shows loading state
- [ ] Success message appears after submit
- [ ] New row appears in Google Sheets
- [ ] n8n workflow executes
- [ ] Backend logs show all steps
- [ ] No errors in browser console
- [ ] No errors in backend logs

## 💡 Quick Wins / Easy Customizations

### Change Form Title
Edit `client/src/components/ClientOnboardingForm.tsx` line 181:
```tsx
<h1>Your Custom Title Here</h1>
```

### Change Colors
Edit `client/src/App.css` line 10:
```css
background: linear-gradient(135deg, #yourcolor1 0%, #yourcolor2 100%);
```

### Add New Industry
Edit `client/src/components/ClientOnboardingForm.tsx` line 34:
```tsx
const industries = [
  'Technology',
  'Your New Industry', // Add here
  // ...
];
```

### Change API Port
Edit `server/.env`:
```env
PORT=8080  # Change from 3001
```

Don't forget to update `client/.env`:
```env
REACT_APP_API_URL=http://localhost:8080
```

## 🔗 Useful Links

- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [React Docs](https://react.dev/)
- [Express Docs](https://expressjs.com/)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [YouTube API](https://developers.google.com/youtube/v3)
- [n8n Docs](https://docs.n8n.io/)

## 🆘 Still Stuck?

1. Check all logs (backend terminal + browser console)
2. Verify `.env` files have correct values
3. Make sure both frontend and backend are running
4. Check Google Cloud APIs are enabled
5. Verify service account has access to Google Sheet
6. Test each piece separately (health endpoint, form UI, etc.)
7. Add `console.log` statements to trace data flow

---

**Pro Tip:** Keep this file open in a browser tab while developing!
