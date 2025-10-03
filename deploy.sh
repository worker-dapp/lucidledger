#!/bin/bash

# Deployment script for LucidLedger
# This script handles Git conflicts and deploys the application

set -e  # Exit on any error

echo "🚀 Starting deployment..."

# Configuration
REPO_URL="https://github.com/worker-dapp/lucidledger.git"
DEPLOY_DIR="/home/ubuntu/lucidledger"
BRANCH="main"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Navigate to deployment directory
cd "$DEPLOY_DIR"

print_status "Resolving Git conflicts..."

# Stash any local changes (including untracked files)
print_warning "Stashing local changes..."
git add .
git stash push -m "Deployment stash $(date)"

# Fetch latest changes from remote
print_status "Fetching latest changes..."
git fetch origin

# Reset to remote main branch to avoid conflicts
print_warning "Resetting to remote main branch..."
git reset --hard origin/main

# Clean up any untracked files
print_status "Cleaning untracked files..."
git clean -fd

print_status "Repository updated successfully"

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -f "client/package.json" ]; then
    print_error "Not in the correct repository directory"
    exit 1
fi

print_status "Building client..."
cd client
npm install
npm run build

print_status "Building server..."
cd ../server
npm install

print_status "Restarting services..."

# Restart PM2 processes (if using PM2)
if command -v pm2 &> /dev/null; then
    pm2 restart all || echo "PM2 not running or no processes to restart"
fi

# Alternative: Restart using systemd (if configured)
# sudo systemctl restart lucidledger || echo "Systemd service not configured"

# Restart nginx (if using nginx)
if command -v nginx &> /dev/null; then
    sudo systemctl reload nginx || echo "Nginx not configured"
fi

print_status "Deployment completed successfully! 🎉"

# Show status
echo ""
echo "📊 Deployment Summary:"
echo "  - Repository: $REPO_URL"
echo "  - Branch: $BRANCH"
echo "  - Directory: $DEPLOY_DIR"
echo "  - Client: Built successfully"
echo "  - Server: Dependencies installed"
echo "  - Services: Restarted"
echo ""
echo "🔗 Application should be available at: https://lucidledger.co"

# Show git status
echo ""
echo "📋 Current Git Status:"
git status
