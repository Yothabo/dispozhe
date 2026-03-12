#!/bin/bash
set -e

echo "🚀 Setting up Chatie Production Environment"
echo "============================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Get domain name
read -p "Enter your domain name (e.g., chat.yourdomain.com): " DOMAIN
echo ""

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    apt-get update
    apt-get install -y docker-compose-plugin
fi

# Install Certbot for SSL
echo "🔒 Installing Certbot for SSL certificates..."
apt-get update
apt-get install -y certbot

# Get SSL certificate
echo "🔐 Obtaining SSL certificate for $DOMAIN..."
certbot certonly --standalone -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Generate secrets
echo "🔑 Generating secure secrets..."
SECRET_KEY=$(openssl rand -hex 32)
DB_ENCRYPTION_KEY=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
DB_PASSWORD=$(openssl rand -base64 32 | tr -d /=+ | cut -c1-32)

# Create production environment file
echo "📝 Creating environment configuration..."
cat > /root/chatie/backend/.env.production << ENVEOF
# Database
DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/chatlly

# Security
SECRET_KEY=${SECRET_KEY}
ENCRYPTION_KEY=${DB_ENCRYPTION_KEY}
JWT_SECRET=${JWT_SECRET}

# Rate Limiting
RATE_LIMIT_REQUESTS=60
RATE_LIMIT_WINDOW=60

# CORS
ALLOWED_ORIGINS=https://${DOMAIN}

# SSL/TLS
SSL_KEY_FILE=/etc/letsencrypt/live/${DOMAIN}/privkey.pem
SSL_CERT_FILE=/etc/letsencrypt/live/${DOMAIN}/fullchain.pem

# Logging
LOG_LEVEL=WARNING
AUDIT_LOG_FILE=/var/log/chatie/audit.log

# Production
BASE_URL=https://${DOMAIN}
ENVIRONMENT=production
FRONTEND_URL=https://${DOMAIN}
ENVEOF

# Update nginx config with domain
sed -i "s/your-production-domain.com/${DOMAIN}/g" /root/chatie/nginx.prod.conf

# Create log directory
mkdir -p /var/log/chatie
chmod 755 /var/log/chatie

# Create data directory
mkdir -p /root/chatie/data
chmod 755 /root/chatie/data

# Export secrets for docker-compose
export DB_PASSWORD=$DB_PASSWORD
export SECRET_KEY=$SECRET_KEY
export ENCRYPTION_KEY=$DB_ENCRYPTION_KEY
export JWT_SECRET=$JWT_SECRET

# Build and start
echo "🐳 Building and starting Docker containers..."
cd /root/chatie
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "✅ Production setup complete!"
echo "================================="
echo "🌐 Your app is live at: https://${DOMAIN}"
echo ""
echo "🔐 Save these secrets in a password manager:"
echo "   SECRET_KEY: $SECRET_KEY"
echo "   DB_ENCRYPTION_KEY: $DB_ENCRYPTION_KEY"
echo "   JWT_SECRET: $JWT_SECRET"
echo "   DB_PASSWORD: $DB_PASSWORD"
echo "================================="
