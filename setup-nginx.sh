#!/bin/bash

# Lucid Ledger Nginx Setup Script
# This script sets up Nginx as a reverse proxy with HTTPS support

set -e

echo "🚀 Setting up Nginx reverse proxy with HTTPS for Lucid Ledger..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root. Please run as a regular user with sudo privileges."
   exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="lucidledger.co"
EMAIL="admin@lucidledger.co"  # Change this to your email

echo -e "${BLUE}Domain:${NC} $DOMAIN"
echo -e "${BLUE}Email:${NC} $EMAIL"
echo ""

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p ssl
mkdir -p certbot-webroot
mkdir -p nginx-logs

# Check if Docker and Docker Compose are installed
echo "🐳 Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"

# Check if domain is accessible
echo "🌐 Checking domain accessibility..."
if ! nslookup $DOMAIN &> /dev/null; then
    echo -e "${YELLOW}⚠️  Warning: Could not resolve domain $DOMAIN${NC}"
    echo "Make sure your domain is properly configured and pointing to this server."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Update email in docker-compose file
echo "📧 Updating email in docker-compose file..."
sed -i.bak "s/your-email@example.com/$EMAIL/g" docker-compose.nginx.yml

# Update domain in nginx.conf
echo "🔧 Updating domain in nginx configuration..."
sed -i.bak "s/lucidledger.co/$DOMAIN/g" nginx.conf

# Check if SSL certificates exist
if [ ! -f "ssl/live/$DOMAIN/fullchain.pem" ] || [ ! -f "ssl/live/$DOMAIN/privkey.pem" ]; then
    echo -e "${YELLOW}⚠️  SSL certificates not found. You'll need to obtain them first.${NC}"
    echo ""
    echo "You have several options to get SSL certificates:"
    echo "1. Use Let's Encrypt (free, automated)"
    echo "2. Use your own certificates"
    echo "3. Use a self-signed certificate for testing"
    echo ""
    
    read -p "Choose option (1-3): " -n 1 -r
    echo
    
    case $REPLY in
        1)
            echo "🔐 Setting up Let's Encrypt certificates..."
            setup_letsencrypt
            ;;
        2)
            echo "🔐 Please place your SSL certificates in the ssl/ directory:"
            echo "   - ssl/live/$DOMAIN/fullchain.pem"
            echo "   - ssl/live/$DOMAIN/privkey.pem"
            read -p "Press Enter when ready..."
            ;;
        3)
            echo "🔐 Creating self-signed certificate for testing..."
            create_self_signed_cert
            ;;
        *)
            echo -e "${RED}❌ Invalid option. Exiting.${NC}"
            exit 1
            ;;
    esac
fi

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.nginx.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo "📊 Checking service status..."
docker-compose -f docker-compose.nginx.yml ps

# Test the setup
echo "🧪 Testing the setup..."
if curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN" | grep -q "301"; then
    echo -e "${GREEN}✅ HTTP to HTTPS redirect is working${NC}"
else
    echo -e "${RED}❌ HTTP to HTTPS redirect is not working${NC}"
fi

if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200"; then
    echo -e "${GREEN}✅ HTTPS is working${NC}"
else
    echo -e "${RED}❌ HTTPS is not working${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Your Lucid Ledger application is now accessible at:"
echo -e "  ${BLUE}https://$DOMAIN${NC}"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose -f docker-compose.nginx.yml logs -f"
echo "  Stop services: docker-compose -f docker-compose.nginx.yml down"
echo "  Restart services: docker-compose -f docker-compose.nginx.yml restart"
echo "  Update SSL: docker-compose -f docker-compose.nginx.yml run --rm certbot renew"
echo ""

setup_letsencrypt() {
    echo "🔐 Setting up Let's Encrypt certificates..."
    
    # Create a temporary nginx configuration for certificate validation
    cat > nginx-temp.conf << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF
    
    # Start temporary nginx for certificate validation
    docker run -d --name nginx-temp \
        -p 80:80 \
        -v $(pwd)/nginx-temp.conf:/etc/nginx/conf.d/default.conf \
        -v $(pwd)/certbot-webroot:/var/www/html \
        nginx:alpine
    
    # Wait for nginx to start
    sleep 5
    
    # Obtain certificates
    docker run --rm \
        -v $(pwd)/ssl:/etc/letsencrypt \
        -v $(pwd)/certbot-webroot:/var/www/html \
        certbot/certbot certonly \
        --webroot \
        --webroot-path=/var/www/html \
        --email $EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN \
        -d www.$DOMAIN
    
    # Stop temporary nginx
    docker stop nginx-temp
    docker rm nginx-temp
    
    # Clean up temporary config
    rm nginx-temp.conf
    
    echo -e "${GREEN}✅ Let's Encrypt certificates obtained successfully${NC}"
}

create_self_signed_cert() {
    echo "🔐 Creating self-signed certificate for testing..."
    
    # Create certificate directory structure
    mkdir -p ssl/live/$DOMAIN
    
    # Generate self-signed certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/live/$DOMAIN/privkey.pem \
        -out ssl/live/$DOMAIN/fullchain.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
    
    echo -e "${GREEN}✅ Self-signed certificate created successfully${NC}"
    echo -e "${YELLOW}⚠️  Note: Self-signed certificates will show security warnings in browsers${NC}"
}
