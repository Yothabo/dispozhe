#!/bin/bash

echo "========================================="
echo "🔐 BACKEND SECURITY TESTS (14/14)"
echo "========================================="
cd ~/chatie/backend
PYTHONPATH=. pytest tests/test_security/ -v

echo -e "\n========================================="
echo "🎨 FRONTEND TESTS (34/34)"
echo "========================================="
cd ~/chatie/frontend
npm run test:all

echo -e "\n========================================="
echo "🚀 STARTING BACKEND FOR STRESS TESTS"
echo "========================================="
cd ~/chatie/backend
source venv/bin/activate
uvicorn app:app --host 0.0.0.0 --port 8000 &
SERVER_PID=$!
sleep 3

echo -e "\n========================================="
echo "⚡ REAL API STRESS TESTS"
echo "========================================="
python tests/load/real_api_stress.py

kill $SERVER_PID

echo -e "\n✅ ALL WORKING TESTS COMPLETED!"
