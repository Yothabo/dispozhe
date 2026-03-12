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
