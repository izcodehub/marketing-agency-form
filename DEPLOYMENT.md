# Deployment Guide - VPS Production Setup

## Server Details
- **Domain**: officepark.online
- **Marketing App**: marketing.officepark.online
- **API**: api.officepark.online
- **VPS IP**: 168.231.68.224
- **Existing Setup**: Traefik + n8n + PHP site

---

## 🚀 Deployment Steps

### Step 1: SSH into Your VPS

```bash
ssh root@168.231.68.224
```

---

### Step 2: Install Node.js (if not installed)

```bash
# Check if Node.js is installed
node --version

# If not installed, install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify installation
node --version  # Should show v20.x
npm --version
```

---

### Step 3: Clone Repository

```bash
# Navigate to your projects directory
cd /opt

# Clone the repository
git clone https://github.com/izcodehub/marketing-agency-form.git
cd marketing-agency-form
```

---

### Step 4: Configure Environment Variables

```bash
# Copy production environment template
cd /opt/marketing-agency-form/server
cp .env.production .env

# Edit with your actual credentials
nano .env
```

**Fill in these values:**
```env
PORT=3001
NODE_ENV=production

# Google Service Account - Get from Google Cloud Console
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Key\n-----END PRIVATE KEY-----\n"

# Google Sheet ID - From your spreadsheet URL
GOOGLE_SHEET_ID=1abc123xyz

# n8n Webhook - Use container name since they're in same Docker network
N8N_WEBHOOK_URL=http://n8n:5678/webhook/your-webhook-path

# CORS - Allow frontend to access API
CORS_ORIGIN=https://marketing.officepark.online
```

**Important Notes:**
- For `GOOGLE_PRIVATE_KEY`, replace all newlines with `\n`
- For `N8N_WEBHOOK_URL`, use `http://n8n:5678` (container name, not localhost)
- Get your n8n webhook path from your n8n workflow

---

### Step 5: Update Your docker-compose.yml

```bash
cd /root
nano docker-compose.yml
```

**Add these services at the end (before the `volumes:` section):**

```yaml
  marketing-backend:
    build:
      context: /opt/marketing-agency-form
      dockerfile: Dockerfile.backend
    restart: always
    env_file:
      - /opt/marketing-agency-form/server/.env
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.marketing-api.rule=Host(`api.officepark.online`)"
      - "traefik.http.routers.marketing-api.entrypoints=websecure"
      - "traefik.http.routers.marketing-api.tls.certresolver=mytlschallenge"
      - "traefik.http.services.marketing-api.loadbalancer.server.port=3001"

  marketing-frontend:
    build:
      context: /opt/marketing-agency-form
      dockerfile: Dockerfile.frontend
    restart: always
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.marketing-web.rule=Host(`marketing.officepark.online`)"
      - "traefik.http.routers.marketing-web.entrypoints=websecure"
      - "traefik.http.routers.marketing-web.tls.certresolver=mytlschallenge"
      - "traefik.http.services.marketing-web.loadbalancer.server.port=80"
```

Save and exit (Ctrl+X, Y, Enter)

---

### Step 6: Build and Deploy

```bash
cd /root

# Build the new containers
docker-compose build marketing-backend marketing-frontend

# Start the new services
docker-compose up -d marketing-backend marketing-frontend

# Check if containers are running
docker ps | grep marketing
```

You should see:
```
root-marketing-backend-1
root-marketing-frontend-1
```

---

### Step 7: Verify Deployment

```bash
# Check container logs
docker logs root-marketing-backend-1
docker logs root-marketing-frontend-1

# Test API health (inside VPS)
curl http://localhost:3001/api/health

# Check Traefik routing
docker logs root-traefik-1 | tail -20
```

---

### Step 8: Test in Browser

1. **Frontend**: https://marketing.officepark.online
   - Should show your marketing form
   - Traefik automatically handles SSL

2. **API**: https://api.officepark.online/api/health
   - Should return API status

3. **Submit Test Form**:
   - Fill out the form on marketing.officepark.online
   - Check if data appears in Google Sheets
   - Check if n8n workflow triggers

---

## 🔧 Troubleshooting

### Container won't start:

```bash
# Check logs for errors
docker logs root-marketing-backend-1 --tail 100
docker logs root-marketing-frontend-1 --tail 100

# Check build logs
docker-compose build --no-cache marketing-backend
docker-compose build --no-cache marketing-frontend
```

### Can't access via domain:

```bash
# Check Traefik logs
docker logs root-traefik-1 | grep marketing

# Verify DNS is pointing to VPS
ping marketing.officepark.online
ping api.officepark.online

# Both should resolve to 168.231.68.224
```

### API can't connect to n8n:

```bash
# Verify n8n is running
docker ps | grep n8n

# Check if backend can reach n8n
docker exec root-marketing-backend-1 ping n8n

# Check n8n webhook URL in .env
cat /opt/marketing-agency-form/server/.env | grep N8N_WEBHOOK_URL
```

### Google Sheets not working:

```bash
# Check Google credentials
docker exec root-marketing-backend-1 node -e "console.log(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL)"

# Check logs for Google API errors
docker logs root-marketing-backend-1 | grep -i google
```

### SSL certificate issues:

```bash
# Check Traefik ACME certificates
ls -la /var/lib/docker/volumes/traefik_data/_data/

# Force certificate renewal
docker restart root-traefik-1
```

---

## 🔄 Updating the Application

When you make code changes and want to deploy updates:

```bash
# On your VPS
cd /opt/marketing-agency-form

# Pull latest code
git pull origin main

# Rebuild containers
cd /root
docker-compose build marketing-backend marketing-frontend

# Restart services (zero-downtime with Traefik)
docker-compose up -d --force-recreate marketing-backend marketing-frontend

# Verify
docker ps | grep marketing
```

---

## 📊 Monitoring

### View logs in real-time:

```bash
# Backend logs
docker logs -f root-marketing-backend-1

# Frontend logs
docker logs -f root-marketing-frontend-1

# All logs
docker-compose logs -f marketing-backend marketing-frontend
```

### Check resource usage:

```bash
# Container stats
docker stats root-marketing-backend-1 root-marketing-frontend-1

# Disk usage
docker system df
```

---

## 🗑️ Removing the Application

If you need to remove the marketing app:

```bash
cd /root

# Stop and remove containers
docker-compose down marketing-backend marketing-frontend

# Remove images
docker rmi root-marketing-backend root-marketing-frontend

# Remove code (optional)
rm -rf /opt/marketing-agency-form

# Edit docker-compose.yml and remove the marketing services
nano docker-compose.yml
```

---

## 🔐 Security Notes

1. **Never commit .env files** - They contain secrets
2. **Keep Google credentials secure** - Limit service account permissions
3. **Regular updates**:
   ```bash
   apt update && apt upgrade -y
   docker system prune -a  # Clean old images
   ```
4. **Firewall rules**:
   ```bash
   # Only allow necessary ports
   ufw allow 22    # SSH
   ufw allow 80    # HTTP
   ufw allow 443   # HTTPS
   ufw enable
   ```

---

## 📝 Post-Deployment Checklist

- [ ] DNS records created (marketing.officepark.online, api.officepark.online)
- [ ] Google Cloud credentials configured
- [ ] Google Sheets ID added to .env
- [ ] n8n webhook URL configured
- [ ] Containers running (`docker ps`)
- [ ] Frontend accessible (https://marketing.officepark.online)
- [ ] API accessible (https://api.officepark.online/api/health)
- [ ] SSL certificates active (check padlock in browser)
- [ ] Test form submission works
- [ ] Data appears in Google Sheets
- [ ] n8n workflow triggers
- [ ] Logs show no errors

---

## 🆘 Getting Help

If something goes wrong:

1. **Check logs first**: `docker logs root-marketing-backend-1`
2. **Check Traefik logs**: `docker logs root-traefik-1`
3. **Verify DNS**: `dig marketing.officepark.online`
4. **Test network**: `docker exec root-marketing-backend-1 ping n8n`
5. **Check environment**: `docker exec root-marketing-backend-1 env | grep GOOGLE`

---

## 🎯 Architecture Overview

```
Internet
    ↓
Traefik (SSL + Routing)
    ↓
    ├─→ marketing.officepark.online → Frontend Container (React/Nginx)
    ├─→ api.officepark.online → Backend Container (Node.js/Express)
    ├─→ n8n.srv1092640.hstgr.cloud → n8n Container
    └─→ officepark.online → PHP Container

Backend → Google Sheets API
Backend → n8n Webhook (http://n8n:5678/webhook/...)
```

All containers share the same Docker network, so they can communicate using container names!

---

Ready to deploy? Start with **Step 1** and work through each step carefully!
