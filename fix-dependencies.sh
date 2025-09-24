#!/bin/bash

echo "🔧 Fixing package-lock.json files..."

# Fix frontend dependencies
echo "📦 Updating frontend dependencies..."
cd client
rm -f package-lock.json
npm install
echo "✅ Frontend dependencies updated"

# Fix backend dependencies
echo "📦 Updating backend dependencies..."
cd ../server
rm -f package-lock.json
npm install
echo "✅ Backend dependencies updated"

echo "🎉 All dependencies fixed!"
echo "📝 Don't forget to commit the updated package-lock.json files:"
echo "   git add client/package-lock.json server/package-lock.json"
echo "   git commit -m 'Update package-lock.json files'"
echo "   git push"
