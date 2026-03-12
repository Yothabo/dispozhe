#!/bin/bash

# Check if services are running
if ! docker ps | grep -q chatie-backend; then
    echo "❌ Backend not running!"
    cd /root/chatie && docker-compose -f docker-compose.prod.yml up -d
fi

# Check disk space
USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $USAGE -gt 80 ]; then
    echo "⚠️  Disk usage critical: $USAGE%"
fi

# Check recent errors in logs
docker logs --tail 100 chatie-backend 2>&1 | grep -i error > /tmp/backend_errors
if [ -s /tmp/backend_errors ]; then
    echo "❌ Errors found in backend logs:"
    cat /tmp/backend_errors
fi

# Check SSL certificate expiry
CERT_FILE="/etc/letsencrypt/live/$(cat /root/chatie/backend/.env.production | grep BASE_URL | cut -d= -f2 | sed 's/https:\/\///')/fullchain.pem"
if [ -f "$CERT_FILE" ]; then
    EXPIRY=$(openssl x509 -enddate -noout -in $CERT_FILE | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s)
    NOW_EPOCH=$(date +%s)
    DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))
    
    if [ $DAYS_LEFT -lt 30 ]; then
        echo "⚠️  SSL certificate expires in $DAYS_LEFT days"
    fi
fi

echo "✅ Monitoring complete"
