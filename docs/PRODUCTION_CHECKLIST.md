# Production Deployment Checklist

This checklist covers all steps required to transition LucidLedger from demo/beta mode to full production deployment.

## Overview

LucidLedger has multiple deployment states:
- **Demo Mode** (`VITE_DEMO_MODE=true`) - Shows warning banners, prevents search engine indexing
- **Production Mode** (`VITE_DEMO_MODE=false`) - Clean UI, ready for public use with SEO enabled

This guide covers the transition from demo to production.

---

## Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] All core features are tested and working
- [ ] Database migrations are up to date
- [ ] Smart contracts are deployed and tested
- [ ] Payment processing is functional
- [ ] User authentication (Dynamic Labs) is configured for production
- [ ] All critical bugs are resolved
- [ ] Legal terms and privacy policy are in place
- [ ] Support email (`admin@lucidledger.co`) is monitored
- [ ] Backup and recovery procedures are documented

---

## Production Mode Transition

### Step 1: Update Demo Mode Toggle

**File:** `client/.env`

Change the demo mode setting:

```bash
# Before (Demo Mode)
VITE_DEMO_MODE=true

# After (Production Mode)
VITE_DEMO_MODE=false
```

**Effect:**
- Removes dismissible warning banner from authenticated pages
- Removes beta notice from landing page
- Enables clean production UI

**Verify locally:**
```bash
cd client
npm run dev
# Browse the site and confirm no demo banners appear
```

### Step 2: Enable Search Engine Indexing

**File:** `client/index.html`

Remove the noindex meta tag at line 12:

```html
<!-- REMOVE THIS LINE: -->
<meta name="robots" content="noindex, nofollow" />
```

**Effect:**
- Allows Google and other search engines to index your site
- Enables SEO and organic discovery
- Job postings will appear in search results

**Important:** Only do this when you're ready for public visibility.

### Step 3: Verify Environment Variables

#### Client Environment (`client/.env`)

```bash
# Production API endpoint
VITE_API_BASE_URL=https://lucidledger.co/api

# Dynamic Labs production environment
VITE_DYNAMIC_ENV_ID=your_production_dynamic_env_id

# Demo mode OFF for production
VITE_DEMO_MODE=false

# Node environment
NODE_ENV=production
```

#### Server Environment (`server/.env` on EC2)

```bash
# Production database (AWS RDS)
DB_HOST=your-rds-endpoint.amazonaws.com
DB_PORT=5432
DB_NAME=lucidledger_prod
DB_USER=your_production_user
DB_PASSWORD=your_production_password

# Server configuration
PORT=5001
NODE_ENV=production

# CORS configuration
CORS_ORIGIN=https://lucidledger.co
```

#### GitHub Secrets (for CI/CD)

Verify these secrets are set in GitHub repository settings:

- `EC2_HOST` - Production server IP/domain
- `EC2_USER` - SSH username
- `SSH_PRIVATE_KEY` - SSH private key for deployment
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Production database
- `VITE_DYNAMIC_ENV_ID` - Dynamic Labs production environment

---

## Build and Deployment

### Option A: Automated Deployment (Recommended)

**Via CI/CD Pipeline:**

```bash
# 1. Commit changes to a branch
git add client/.env client/index.html
git commit -m "Enable production mode and SEO indexing"
git push origin your-branch

# 2. Create pull request to main
# Review changes carefully

# 3. Merge to main
# GitHub Actions will automatically deploy to production
```

The CI/CD pipeline will:
- Run tests and security scans
- Build Docker images on EC2
- Deploy to production
- Run health checks

See [CI_CD_SETUP.md](./CI_CD_SETUP.md) for details.

### Option B: Manual Deployment

**On EC2 server:**

```bash
# 1. SSH to production server
ssh ec2-user@your-server-ip

# 2. Navigate to project directory
cd /path/to/lucidledger

# 3. Pull latest changes
git pull origin main

# 4. Update environment variables
nano client/.env
# Set VITE_DEMO_MODE=false

# 5. Remove noindex tag
nano client/index.html
# Remove: <meta name="robots" content="noindex, nofollow" />

# 6. Rebuild and restart services
docker-compose -f docker-compose.nginx.yml down
docker-compose -f docker-compose.nginx.yml up -d --build

# 7. Verify deployment
docker-compose -f docker-compose.nginx.yml ps
docker-compose -f docker-compose.nginx.yml logs -f
```

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# Frontend loads
curl -I https://lucidledger.co
# Should return: 200 OK

# Backend API is accessible
curl https://lucidledger.co/api/health
# Should return: {"status":"ok"}

# HTTPS is working
curl -I https://lucidledger.co
# Should include: Strict-Transport-Security header
```

### 2. UI Verification

Visit the site and verify:

- [ ] Landing page loads without demo banners
- [ ] Job search page is accessible
- [ ] Login flow works (Dynamic Labs)
- [ ] Employee dashboard loads correctly
- [ ] Employer dashboard loads correctly
- [ ] Job application flow works end-to-end
- [ ] No console errors in browser

### 3. SEO Verification

```bash
# Check robots meta tag is removed
curl https://lucidledger.co | grep "robots"
# Should NOT return: noindex, nofollow
```

Visit these tools to verify indexing:
- [Google Search Console](https://search.google.com/search-console) - Submit sitemap
- [Bing Webmaster Tools](https://www.bing.com/webmasters) - Submit sitemap
- [SSL Labs](https://www.ssllabs.com/ssltest/) - Verify SSL configuration

### 4. Database Verification

```bash
# SSH to EC2 and check database connectivity
docker-compose -f docker-compose.nginx.yml exec backend node -e "
const { sequelize } = require('./models');
sequelize.authenticate()
  .then(() => console.log('Database connected'))
  .catch(err => console.error('Database error:', err));
"
```

### 5. Monitor Logs

```bash
# Watch logs for errors
docker-compose -f docker-compose.nginx.yml logs -f

# Check specific services
docker-compose -f docker-compose.nginx.yml logs -f nginx
docker-compose -f docker-compose.nginx.yml logs -f frontend
docker-compose -f docker-compose.nginx.yml logs -f backend
```

---

## Rollback Plan

If issues arise after production deployment:

### Quick Rollback: Re-enable Demo Mode

**On EC2 server:**

```bash
# 1. SSH to server
ssh ec2-user@your-server-ip

# 2. Update environment
cd /path/to/lucidledger
nano client/.env
# Change: VITE_DEMO_MODE=false to VITE_DEMO_MODE=true

# 3. Rebuild frontend
docker-compose -f docker-compose.nginx.yml up -d --build frontend

# 4. Verify
curl https://lucidledger.co
# Demo banners should reappear
```

### Full Rollback: Previous Git Commit

```bash
# 1. Identify last working commit
git log --oneline

# 2. Revert to previous commit
git revert <commit-hash>

# 3. Push revert
git push origin main

# 4. Let CI/CD redeploy automatically
# Or manually redeploy with docker-compose
```

---

## Production Maintenance

### Ongoing Tasks

1. **Monitor Application:**
   - Check server logs daily: `docker-compose logs -f`
   - Monitor database performance
   - Watch for security vulnerabilities

2. **SSL Certificate Renewal:**
   - Automatic renewal via GitHub Actions workflow (weekly)
   - Manual check: `docker-compose run --rm certbot renew`
   - See [NGINX_SETUP.md](./NGINX_SETUP.md) for details

3. **Database Backups:**
   - Set up automated RDS snapshots
   - Test restore procedures regularly

4. **Security Updates:**
   - Review Dependabot alerts
   - Update dependencies monthly
   - Monitor CI/CD security scans

5. **Performance Monitoring:**
   - Monitor response times
   - Check Docker container resource usage
   - Optimize database queries as needed

### Emergency Contacts

- **Technical Issues:** Check GitHub Issues
- **Security Issues:** security@lucidledger.co
- **General Support:** admin@lucidledger.co

---

## Documentation References

- [CI/CD Pipeline Setup](./CI_CD_SETUP.md) - Automated deployment
- [Docker Setup Guide](./DOCKER_SETUP.md) - Container management
- [Environment Configuration](./ENVIRONMENT_SETUP.md) - Environment variables
- [Nginx Reverse Proxy](./NGINX_SETUP.md) - SSL and proxy configuration
- [Beta Access Gate](./beta-access-gate-implementation-plan.md) - Future access control

---

## Success Criteria

Production deployment is successful when:

- [ ] Site is accessible at https://lucidledger.co
- [ ] No demo mode warnings appear to users
- [ ] Search engines can index the site (robots meta tag removed)
- [ ] Users can create accounts and login
- [ ] Job posting and application flows work correctly
- [ ] All API endpoints respond correctly
- [ ] SSL certificates are valid
- [ ] No critical errors in logs
- [ ] Database connections are stable
- [ ] Payment processing works (if enabled)

---

**Last Updated:** 2026-01-11

**Version:** 1.0.0
