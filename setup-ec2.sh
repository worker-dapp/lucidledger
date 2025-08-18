#!/bin/bash

# Lucid Ledger EC2 Setup Script
# This script sets up Nginx as a reverse proxy with HTTPS support on EC2

set -e

echo "🚀 Setting up Nginx reverse proxy with HTTPS for Lucid Ledger on EC2..."

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
EMAIL="admin@lucidledger.co"

echo -e "${BLUE}Domain:${NC} $DOMAIN"
echo -e "${BLUE}Email:${NC} $EMAIL"
echo ""

# Function to install Docker on EC2
install_docker() {
    echo "Installing Docker..."
    sudo yum update -y
    sudo yum install -y docker
    sudo service docker start
    sudo usermod -a -G docker $USER
    echo -e "${YELLOW}⚠️  Please log out and log back in for Docker group changes to take effect${NC}"
    echo "Or run: newgrp docker"
}

# Function to install Docker Compose on EC2
install_docker_compose() {
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
}

# Function to check EC2 security groups
check_ec2_security_groups() {
    echo "Checking security group configuration..."
    echo -e "${YELLOW}⚠️  IMPORTANT: Ensure your EC2 security group allows:${NC}"
    echo "  - SSH (Port 22) from your IP"
    echo "  - HTTP (Port 80) from anywhere (0.0.0.0/0)"
    echo "  - HTTPS (Port 443) from anywhere (0.0.0.0/0)"
    echo ""
    echo "You can configure this in the AWS Console:"
    echo "  EC2 → Security Groups → Select your security group → Edit inbound rules"
    echo ""
    read -p "Press Enter when you've verified your security group configuration..."
}

# Function to set up Let's Encrypt on EC2
setup_letsencrypt_ec2() {
    echo "🔐 Setting up Let's Encrypt certificates on EC2..."
    
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

# Function to create self-signed certificate
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

# Function to test EC2 setup
test_ec2_setup() {
    echo "Testing EC2 setup..."
    
    # Get EC2 public IP
    if command -v curl &> /dev/null; then
        PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "unknown")
        echo -e "${BLUE}EC2 Public IP:${NC} $PUBLIC_IP"
    fi
    
    # Test HTTP to HTTPS redirect
    if curl -s -o /dev/null -w "%{http_code}" "http://$DOMAIN" | grep -q "301"; then
        echo -e "${GREEN}✅ HTTP to HTTPS redirect is working${NC}"
    else
        echo -e "${RED}❌ HTTP to HTTPS redirect is not working${NC}"
    fi
    
    # Test HTTPS
    if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN" | grep -q "200"; then
        echo -e "${GREEN}✅ HTTPS is working${NC}"
    else
        echo -e "${RED}❌ HTTPS is not working${NC}"
    fi
    
    # Test API endpoints
    if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api" | grep -q "200"; then
        echo -e "${GREEN}✅ API endpoint is working${NC}"
    else
        echo -e "${RED}❌ API endpoint is not working${NC}"
    fi
}

# Check if we're on EC2
if curl -s http://169.254.169.254/latest/meta-data/instance-id > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running on EC2 instance${NC}"
    INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
    echo -e "${BLUE}Instance ID:${NC} $INSTANCE_ID"
else
    echo -e "${YELLOW}⚠️  Not running on EC2 - some features may not work${NC}"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p ssl
mkdir -p certbot-webroot
mkdir -p nginx-logs

# Check if Docker and Docker Compose are installed
echo "🐳 Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Installing Docker...${NC}"
    install_docker
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Installing Docker Compose...${NC}"
    install_docker_compose
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"

# Check if domain is accessible
echo "🌐 Checking domain accessibility..."
if ! nslookup $DOMAIN &> /dev/null; then
    echo -e "${YELLOW}⚠️  Warning: Could not resolve domain $DOMAIN${NC}"
    echo "Make sure your domain is properly configured and pointing to this EC2 instance."
    echo "You may need to:"
    echo "1. Update your domain's A record to point to this EC2 instance's public IP"
    echo "2. Wait for DNS propagation (can take up to 48 hours)"
    echo "3. Ensure your EC2 security group allows inbound traffic on ports 80 and 443"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check EC2 security group configuration
echo "🔒 Checking EC2 security group configuration..."
check_ec2_security_groups

# Update email in docker-compose file
echo "📧 Updating email in docker-compose file..."
sed -i.bak "s/your-email@example.com/$EMAIL/g" docker-compose.nginx.yml

# Update domain in nginx.conf
echo "🔧 Updating domain in nginx configuration..."
sed -i.bak "s/lucidledger.co/$DOMAIN/g" nginx.conf

# Copy environment files
echo "📋 Setting up environment files..."
if [ ! -f "server/.env" ]; then
    echo "Copying server environment template..."
    cp server/env.ec2 server/.env
    echo -e "${YELLOW}⚠️  Please edit server/.env with your actual values${NC}"
fi

if [ ! -f "client/.env" ]; then
    echo "Copying client environment template..."
    cp client/env.ec2 client/.env
    echo -e "${YELLOW}⚠️  Please edit client/.env with your actual values${NC}"
fi

# Check if SSL certificates exist
if [ ! -f "ssl/live/$DOMAIN/fullchain.pem" ] || [ ! -f "ssl/live/$DOMAIN/privkey.pem" ]; then
    echo -e "${YELLOW}⚠️  SSL certificates not found. You'll need to obtain them first.${NC}"
    echo ""
    echo "You have several options to get SSL certificates:"
    echo "1. Use Let's Encrypt (free, automated) - RECOMMENDED for EC2"
    echo "2. Use your own certificates"
    echo "3. Use a self-signed certificate for testing"
    echo ""
    
    read -p "Choose option (1-3): " -n 1 -r
    echo
    
    case $REPLY in
        1)
            echo "🔐 Setting up Let's Encrypt certificates..."
            setup_letsencrypt_ec2
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
sleep 15

# Check service status
echo "📊 Checking service status..."
docker-compose -f docker-compose.nginx.yml ps

# Test the setup
echo "🧪 Testing the setup..."
test_ec2_setup

echo ""
echo -e "${GREEN}🎉 EC2 setup complete!${NC}"
echo ""
echo "Your Lucid Ledger application is now accessible at:"
echo -e "  ${BLUE}https://$DOMAIN${NC}"
echo ""
echo "EC2-specific notes:"
echo "  - Make sure your domain points to this EC2 instance's public IP"
echo "  - Ensure security groups allow inbound traffic on ports 80 and 443"
echo "  - Consider setting up an Elastic IP for consistent addressing"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose -f docker-compose.nginx.yml logs -f"
echo "  Stop services: docker-compose -f docker-compose.nginx.yml down"
echo "  Restart services: docker-compose -f docker-compose.nginx.yml restart"
echo "  Update SSL: docker-compose -f docker-compose.nginx.yml run --rm certbot renew"
echo ""
