from fastapi import Request, HTTPException
from typing import Dict, List
import time
import logging
from collections import defaultdict

logger = logging.getLogger(__name__)

class RateLimiter:
    def __init__(self, requests_per_minute: int = 60, whitelist: List[str] = None):
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, List[float]] = defaultdict(list)
        self.whitelist = whitelist or ['127.0.0.1', 'localhost']
    
    async def __call__(self, request: Request):
        client_ip = request.client.host if request.client else "unknown"
        
        # Skip rate limiting for whitelisted IPs
        if client_ip in self.whitelist:
            return True
        
        now = time.time()
        window_start = now - 60
        
        # Clean old requests
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if req_time > window_start
        ]
        
        # Check rate limit
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            raise HTTPException(
                status_code=429, 
                detail="Too many requests. Please slow down."
            )
        
        self.requests[client_ip].append(now)
        return True
    
    # Different limits for different endpoints
    async def strict(self, request: Request):
        """Stricter limit for authentication endpoints"""
        client_ip = request.client.host if request.client else "unknown"
        
        if client_ip in self.whitelist:
            return True
        
        now = time.time()
        window_start = now - 60
        
        self.requests[f"strict_{client_ip}"] = [
            req_time for req_time in self.requests.get(f"strict_{client_ip}", [])
            if req_time > window_start
        ]
        
        if len(self.requests.get(f"strict_{client_ip}", [])) >= 10:  # 10 per minute
            raise HTTPException(status_code=429, detail="Too many authentication attempts")
        
        self.requests[f"strict_{client_ip}"].append(now)
        return True

rate_limiter = RateLimiter()
