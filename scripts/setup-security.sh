#!/bin/bash

# Security setup script for NestJS application
# This script installs and configures security features for the application

# Make script exit when a command fails
set -e

# Print commands before executing them
set -x

echo "🔒 Setting up security features for NestJS application..."

# Install required packages
echo "📦 Installing security packages..."
npm install helmet
npm install @nestjs/throttler
npm install @nestjs/schedule
npm install bcrypt-ts
npm install crypto-secure-random-digit

# Update environment variables
echo "🔧 Updating environment variables..."
cat >> .env << EOL

# Security Settings
JWT_SECRET=your_jwt_secret_here_$(openssl rand -hex 32)
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=your_refresh_secret_here_$(openssl rand -hex 32)
JWT_REFRESH_EXPIRATION=30d

# Authentication Security
PASSWORD_MIN_LENGTH=8
PASSWORD_MAX_ATTEMPTS=5
AUTH_LOCKOUT_TIME=15
AUTH_THROTTLE_TTL=60
AUTH_THROTTLE_LIMIT=5
EOL

# Create necessary directories
echo "📁 Creating security-related directories..."
mkdir -p src/common/filters
mkdir -p src/common/utils
mkdir -p src/common/services
mkdir -p src/auth/decorators
mkdir -p src/auth/guards
mkdir -p src/database/token-blacklist

# Security checks
echo "🔍 Running security checks..."

# Check for vulnerabilities in npm packages
npm audit

# Remind about HTTPS
echo "⚠️ REMINDER: Ensure your production deployment uses HTTPS!"

echo "✅ Security setup completed!"
echo "🔥 Next steps:"
echo "  1. Review and customize security configurations"
echo "  2. Configure HTTPS in your production environment"
echo "  3. Implement regular security audits"
echo "  4. Set up proper environment variable management for production" 