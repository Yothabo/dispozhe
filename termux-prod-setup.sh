#!/data/data/com.termux/files/usr/bin/bash

cd ~/chatie

echo "🔐 Generating secure secrets..."

# Use Termux's openssl
SECRET_KEY=$(openssl rand -hex 32 2>/dev/null)
if [ -z "$SECRET_KEY" ]; then
    # Fallback if openssl fails
    SECRET_KEY=$(cat /dev/urandom | tr -dc 'a-f0-9' | fold -w 64 | head -n 1)
fi

DB_ENCRYPTION_KEY=$(openssl rand -base64 32 2>/dev/null)
if [ -z "$DB_ENCRYPTION_KEY" ]; then
    DB_ENCRYPTION_KEY=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9+/' | fold -w 44 | head -n 1 | sed 's/=*$//')==
fi

JWT_SECRET=$(openssl rand -base64 32 2>/dev/null)
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9+/' | fold -w 44 | head -n 1 | sed 's/=*$//')==
fi

DB_PASSWORD=$(openssl rand -base64 32 2>/dev/null | tr -d '/+=' | cut -c1-32)
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
fi

echo "✅ Secrets generated"
echo "----------------------------------------"
echo "SECRET_KEY: $SECRET_KEY"
echo "DB_ENCRYPTION_KEY: $DB_ENCRYPTION_KEY"
echo "JWT_SECRET: $JWT_SECRET"
echo "DB_PASSWORD: $DB_PASSWORD"
echo "----------------------------------------"
echo "⚠️  SAVE THESE IN A SECURE PLACE!"
echo ""

# Get local IP
if command -v ifconfig &> /dev/null; then
    LOCAL_IP=$(ifconfig 2>/dev/null | grep -o 'inet [0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+' | grep -v '127.0.0.1' | head -1 | cut -d' ' -f2)
else
    # Try ip command if ifconfig not available
    LOCAL_IP=$(ip -4 addr show | grep -o 'inet [0-9]\+\.[0-9]\+\.[0-9]\+\.[0-9]\+' | grep -v '127.0.0.1' | head -1 | cut -d' ' -f2)
fi

if [ -z "$LOCAL_IP" ]; then
    LOCAL_IP="192.168.1.xxx"
fi

# Create production environment file
cat > ~/chatie/backend/.env.production << 'ENVEOF'
# Database - SQLite for Termux
DATABASE_URL=sqlite:///./chatlly.db

# Security
SECRET_KEY=${SECRET_KEY}
ENCRYPTION_KEY=${DB_ENCRYPTION_KEY}
JWT_SECRET=${JWT_SECRET}

# Rate Limiting
RATE_LIMIT_REQUESTS=60
RATE_LIMIT_WINDOW=60

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4173,http://127.0.0.1:3000,http://${LOCAL_IP}:3000

# SSL/TLS - Not used in Termux
SSL_KEY_FILE=
SSL_CERT_FILE=

# Logging
LOG_LEVEL=INFO
AUDIT_LOG_FILE=./audit.log

# Production URLs
BASE_URL=http://${LOCAL_IP}:8080
ENVIRONMENT=production
FRONTEND_URL=http://${LOCAL_IP}:3000
ENVEOF

# Replace the placeholders with actual values
sed -i "s/\${SECRET_KEY}/$SECRET_KEY/g" ~/chatie/backend/.env.production
sed -i "s/\${DB_ENCRYPTION_KEY}/$DB_ENCRYPTION_KEY/g" ~/chatie/backend/.env.production
sed -i "s/\${JWT_SECRET}/$JWT_SECRET/g" ~/chatie/backend/.env.production
sed -i "s/\${LOCAL_IP}/$LOCAL_IP/g" ~/chatie/backend/.env.production

echo "✅ Environment file created at backend/.env.production"

# Create audit log
touch ~/chatie/backend/audit.log
chmod 600 ~/chatie/backend/audit.log

# Create backup script
cat > ~/chatie/backup-termux.sh << 'BACKUPEOF'
#!/data/data/com.termux/files/usr/bin/bash

BACKUP_DIR="$HOME/storage/shared/chatlly-backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Request storage permission if needed
termux-setup-storage 2>/dev/null || true

mkdir -p $BACKUP_DIR

# Backup database
if [ -f "$HOME/chatie/backend/chatlly.db" ]; then
    cp "$HOME/chatie/backend/chatlly.db" "$BACKUP_DIR/chatlly_$DATE.db"
fi

# Backup environment
if [ -f "$HOME/chatie/backend/.env.production" ]; then
    cp "$HOME/chatie/backend/.env.production" "$BACKUP_DIR/env_$DATE"
fi

# Backup audit logs
if [ -f "$HOME/chatie/backend/audit.log" ]; then
    cp "$HOME/chatie/backend/audit.log" "$BACKUP_DIR/audit_$DATE.log"
fi

# Compress if we have files
if [ -f "$BACKUP_DIR/chatlly_$DATE.db" ] || [ -f "$BACKUP_DIR/env_$DATE" ] || [ -f "$BACKUP_DIR/audit_$DATE.log" ]; then
    cd $BACKUP_DIR
    tar -czf "backup_$DATE.tar.gz" chatlly_$DATE.db env_$DATE audit_$DATE.log 2>/dev/null || true
    rm -f chatlly_$DATE.db env_$DATE audit_$DATE.log
    echo "✅ Backup saved to: $BACKUP_DIR/backup_$DATE.tar.gz"
else
    echo "⚠️  No files to backup"
fi
BACKUPEOF

chmod +x ~/chatie/backup-termux.sh

# Create monitor script
cat > ~/chatie/monitor-termux.sh << 'MONITOREOF'
#!/data/data/com.termux/files/usr/bin/bash

echo "🔍 Monitoring Chatie..."

# Check if backend is running
if ! pgrep -f "uvicorn app:app" > /dev/null; then
    echo "❌ Backend not running!"
    echo "   Start it with: cd ~/chatie/backend && source venv/bin/activate && python app.py"
else
    echo "✅ Backend is running"
fi

# Check if frontend is running
if ! pgrep -f "vite" > /dev/null; then
    echo "⚠️  Frontend not running"
    echo "   Start it with: cd ~/chatie/frontend && npm run dev"
else
    echo "✅ Frontend is running"
fi

# Check disk space
USAGE=$(df $HOME | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $USAGE -gt 80 ]; then
    echo "⚠️  Storage critical: $USAGE% used"
else
    echo "✅ Storage: $USAGE% used"
fi

# Check recent errors
if [ -f ~/chatie/backend/audit.log ]; then
    ERRORS=$(tail -50 ~/chatie/backend/audit.log | grep -i error | wc -l)
    if [ $ERRORS -gt 0 ]; then
        echo "⚠️  Found $ERRORS recent errors in audit log"
        tail -10 ~/chatie/backend/audit.log | grep -i error
    else
        echo "✅ No recent errors found"
    fi
fi

echo "✅ Monitor complete at $(date)"
MONITOREOF

chmod +x ~/chatie/monitor-termux.sh

# Create crontab file
cat > ~/chatie/crontab-termux << 'CRONTABEOF'
# Backup daily at 2 AM
0 2 * * * cd ~/chatie && ./backup-termux.sh >> ~/chatie/backup.log 2>&1

# Monitor every 30 minutes
*/30 * * * * cd ~/chatie && ./monitor-termux.sh >> ~/chatie/monitor.log 2>&1
CRONTABEOF

echo ""
echo "✅ Termux production setup complete!"
echo ""
echo "📋 YOUR SECRETS (SAVE THESE):"
echo "========================================"
echo "SECRET_KEY: $SECRET_KEY"
echo "DB_ENCRYPTION_KEY: $DB_ENCRYPTION_KEY"
echo "JWT_SECRET: $JWT_SECRET"
echo "DB_PASSWORD: $DB_PASSWORD"
echo "========================================"
echo ""
echo "🌐 Your local IP: $LOCAL_IP"
echo ""
echo "🚀 To start the backend:"
echo "   cd ~/chatie/backend"
echo "   source venv/bin/activate"
echo "   python app.py"
echo ""
echo "📱 Access from other devices on your network:"
echo "   Backend API: http://$LOCAL_IP:8080"
echo "   Frontend app: http://$LOCAL_IP:3000 (after running npm run dev)"
echo ""
echo "💾 To set up automatic backups:"
echo "   crontab -e"
echo "   Then paste the contents from ~/chatie/crontab-termux"
echo ""
echo "🔍 To monitor: ./monitor-termux.sh"
echo "📤 To backup: ./backup-termux.sh"
