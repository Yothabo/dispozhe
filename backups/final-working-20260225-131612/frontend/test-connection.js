const API_URL = 'http://localhost:8080';
fetch(`${API_URL}/health`)
  .then(res => res.json())
  .then(data => console.log('✅ Health check:', data))
  .catch(err => console.error('❌ Connection failed:', err));

fetch(`${API_URL}/session/create`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ duration: 5 })
})
  .then(res => res.json())
  .then(data => console.log('✅ Session created:', data))
  .catch(err => console.error('❌ Session creation failed:', err));
