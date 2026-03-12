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
