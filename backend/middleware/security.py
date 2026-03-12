from fastapi import Request, HTTPException
import re

async def enforce_https(request: Request, call_next):
    # In production, redirect HTTP to HTTPS
    if request.url.scheme == "http" and "localhost" not in request.url.hostname:
        url = request.url.replace(scheme="https")
        return RedirectResponse(url)
    return await call_next(request)

def validate_origin(origin: str) -> bool:
    """Validate that WebSocket connections come from our domain"""
    allowed_patterns = [
        r'^https?://localhost(:\d+)?$',
        r'^https://[a-zA-Z0-9-]+\.netlify\.app$',
        r'^https://[a-zA-Z0-9-]+\.vercel\.app$',
        r'^https://[a-zA-Z0-9-]+\.onrender\.com$',
    ]
    return any(re.match(pattern, origin) for pattern in allowed_patterns)
