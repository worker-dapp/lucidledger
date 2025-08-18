# Nginx Reverse Proxy Setup with HTTPS for Lucid Ledger

This guide will help you set up Nginx as a reverse proxy with HTTPS support for your Lucid Ledger application.

## 🏗️ Architecture Overview

```
Internet → Nginx (Port 80/443) → Frontend (Port 8080) + Backend (Port 5001)
```

- **Nginx**: Acts as a reverse proxy, handles SSL termination, and routes traffic
- **Frontend**: Your React application (Vite dev server or production build)
- **Backend**: Your Express.js API server
- **PostgreSQL**: Database server

## 📋 Prerequisites

1. **Domain Name**: A domain pointing to your server (e.g., `lucidledger.co`)
2. **Server**: A VPS or cloud server with Docker and Docker Compose installed
3. **Ports**: Ports 80 and 443 must be open on your server
4. **Docker**: Docker and Docker Compose must be installed

## 🚀 Quick Setup

### 1. Clone and Navigate to Project
```bash
cd /path/to/your/lucid-ledger
```

### 2. Make Setup Script Executable
```bash
chmod +x setup-nginx.sh
```

### 3. Update Configuration
Edit the setup script to use your domain and email:
```bash
nano setup-nginx.sh
```
Change these lines:
```bash
DOMAIN="your-domain.com"
EMAIL="your-email@example.com"
```

### 4. Run Setup Script
```bash
./setup-nginx.sh
```

The script will:
- Check prerequisites
- Create necessary directories
- Set up SSL certificates (Let's Encrypt, your own, or self-signed)
- Start all services
- Test the setup

## 🔧 Manual Setup

If you prefer to set up manually or the script doesn't work for your environment:

### 1. Create Directories
```bash
mkdir -p ssl certbot-webroot nginx-logs
```

### 2. Update Configuration Files
- Update `nginx.conf` with your domain
- Update `docker-compose.nginx.yml` with your email
- Update `client/src/api/apiClient.js` to use HTTPS

### 3. Obtain SSL Certificates

#### Option A: Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Get certificates
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com
```

#### Option B: Your Own Certificates
Place your certificates in:
- `ssl/live/your-domain.com/fullchain.pem`
- `ssl/live/your-domain.com/privkey.pem`

#### Option C: Self-Signed (Testing Only)
```bash
mkdir -p ssl/live/your-domain.com
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/live/your-domain.com/privkey.pem \
    -out ssl/live/your-domain.com/fullchain.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=your-domain.com"
```

### 4. Start Services
```bash
docker-compose -f docker-compose.nginx.yml up -d
```

## 🔍 Configuration Details

### Nginx Configuration (`nginx.conf`)

The Nginx configuration includes:

- **HTTP to HTTPS redirect**: All HTTP traffic is redirected to HTTPS
- **SSL termination**: Handles SSL certificates and encryption
- **Reverse proxy**: Routes traffic to frontend and backend services
- **Security headers**: HSTS, X-Frame-Options, XSS Protection, etc.
- **Gzip compression**: Reduces bandwidth usage
- **Static asset caching**: Optimizes performance for static files
- **CORS support**: Handles cross-origin requests properly

### Docker Compose (`docker-compose.nginx.yml`)

- **Nginx**: Reverse proxy on ports 80 and 443
- **Frontend**: React app on port 8080 (internal)
- **Backend**: Express API on port 5001
- **PostgreSQL**: Database on port 5433
- **Certbot**: Optional SSL certificate renewal

## 🌐 Domain Configuration

### DNS Records
Ensure your domain points to your server:
```
A     your-domain.com     → Your server's IP address
A     www.your-domain.com → Your server's IP address
```

### Server Firewall
Open necessary ports:
```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22  # SSH
```

## 🔐 SSL Certificate Management

### Let's Encrypt Renewal
Certificates expire every 90 days. Set up automatic renewal:

```bash
# Add to crontab
sudo crontab -e

# Add this line (runs twice daily)
0 0,12 * * * docker-compose -f /path/to/lucid-ledger/docker-compose.nginx.yml run --rm certbot renew
```

### Manual Renewal
```bash
docker-compose -f docker-compose.nginx.yml run --rm certbot renew
docker-compose -f docker-compose.nginx.yml restart nginx
```

## 🧪 Testing Your Setup

### 1. Check Service Status
```bash
docker-compose -f docker-compose.nginx.yml ps
```

### 2. Test HTTP to HTTPS Redirect
```bash
curl -I http://your-domain.com
# Should return 301 redirect to HTTPS
```

### 3. Test HTTPS
```bash
curl -I https://your-domain.com
# Should return 200 OK
```

### 4. Test API Endpoints
```bash
curl https://your-domain.com/api
curl https://your-domain.com/health
```

## 📊 Monitoring and Logs

### View Logs
```bash
# All services
docker-compose -f docker-compose.nginx.yml logs -f

# Specific service
docker-compose -f docker-compose.nginx.yml logs -f nginx
docker-compose -f docker-compose.nginx.yml logs -f frontend
docker-compose -f docker-compose.nginx.yml logs -f backend
```

### Nginx Logs
```bash
# Access logs
docker exec nginx-proxy tail -f /var/log/nginx/access.log

# Error logs
docker exec nginx-proxy tail -f /var/log/nginx/error.log
```

## 🚨 Troubleshooting

### Common Issues

#### 1. SSL Certificate Errors
```bash
# Check certificate validity
openssl x509 -in ssl/live/your-domain.com/fullchain.pem -text -noout

# Verify certificate chain
openssl verify ssl/live/your-domain.com/fullchain.pem
```

#### 2. Nginx Configuration Errors
```bash
# Test nginx configuration
docker exec nginx-proxy nginx -t

# Reload nginx configuration
docker exec nginx-proxy nginx -s reload
```

#### 3. Port Conflicts
```bash
# Check what's using ports 80 and 443
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443

# Stop conflicting services
sudo systemctl stop apache2  # if Apache is running
sudo systemctl stop nginx    # if system nginx is running
```

#### 4. Docker Issues
```bash
# Restart Docker daemon
sudo systemctl restart docker

# Clean up containers and volumes
docker-compose -f docker-compose.nginx.yml down -v
docker system prune -f
```

### Debug Mode
Enable debug logging in Nginx:
```bash
# Edit nginx.conf and add this line in the http block:
error_log /var/log/nginx/error.log debug;

# Restart nginx
docker-compose -f docker-compose.nginx.yml restart nginx
```

## 🔄 Updates and Maintenance

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart services
docker-compose -f docker-compose.nginx.yml down
docker-compose -f docker-compose.nginx.yml up -d --build
```

### Update Nginx Configuration
```bash
# Edit nginx.conf
nano nginx.conf

# Restart nginx
docker-compose -f docker-compose.nginx.yml restart nginx
```

### Backup SSL Certificates
```bash
# Create backup
tar -czf ssl-backup-$(date +%Y%m%d).tar.gz ssl/

# Restore from backup
tar -xzf ssl-backup-YYYYMMDD.tar.gz
```

## 📚 Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [SSL Labs SSL Test](https://www.ssllabs.com/ssltest/)

## 🆘 Getting Help

If you encounter issues:

1. Check the logs: `docker-compose -f docker-compose.nginx.yml logs -f`
2. Verify your domain DNS settings
3. Ensure ports 80 and 443 are open
4. Check SSL certificate validity
5. Verify Nginx configuration syntax

## 📝 License

This setup guide is part of the Lucid Ledger project and follows the same license terms.
