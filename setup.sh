#!/bin/bash

# Environment Setup Script for Medical Registry Backend
# This script helps set up the environment for development

set -e

echo "🏥 Medical Registry Backend - Environment Setup"
echo "=============================================="

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created!"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file with your actual configuration values"
    echo "   The default values are for development only."
else
    echo "✅ .env file already exists"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    if command -v pnpm &> /dev/null; then
        pnpm install
    elif command -v npm &> /dev/null; then
        npm install
    else
        echo "❌ Neither npm nor pnpm found. Please install Node.js and npm."
        exit 1
    fi
    echo "✅ Dependencies installed!"
else
    echo "✅ Dependencies already installed"
fi

# Check for required environment variables
echo ""
echo "🔍 Checking environment configuration..."

if [ -f ".env" ]; then
    # Source the .env file
    set -a
    source .env
    set +a
    
    # Check required variables
    required_vars=("DATABASE_URL" "KEYCLOAK_BASE_URL" "KEYCLOAK_REALM" "KEYCLOAK_CLIENT_ID" "KEYCLOAK_CLIENT_SECRET")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        echo "✅ All required environment variables are set"
    else
        echo "⚠️  Missing or empty required variables:"
        for var in "${missing_vars[@]}"; do
            echo "   - $var"
        done
        echo ""
        echo "Please edit your .env file and set these variables."
    fi
fi

echo ""
echo "🚀 Setup complete! Next steps:"
echo "   1. Review and update your .env file with proper values"
echo "   2. Set up your PostgreSQL database"
echo "   3. Set up your Keycloak instance"
echo "   4. Run: npm run build"
echo "   5. Run: npm start"
echo ""
echo "For Docker development:"
echo "   docker-compose up -d"
echo ""
echo "📖 See README.md for detailed configuration instructions"
