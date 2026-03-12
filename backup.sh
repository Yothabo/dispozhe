#!/bin/bash
BACKUP_DIR="/root/backups/chatie"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker exec chatie-db pg_dump -U postgres chatlly > $BACKUP_DIR/db_$DATE.sql

# Backup environment files
cp /root/chatie/backend/.env.production $BACKUP_DIR/env_$DATE

# Backup audit logs
cp /var/log/chatie/audit.log $BACKUP_DIR/audit_$DATE.log

# Compress
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR db_$DATE.sql env_$DATE audit_$DATE.log

# Clean up uncompressed files
rm $BACKUP_DIR/db_$DATE.sql $BACKUP_DIR/env_$DATE $BACKUP_DIR/audit_$DATE.log

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "✅ Backup completed: $BACKUP_DIR/backup_$DATE.tar.gz"
