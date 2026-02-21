import os
from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/stream", tags=["stream"])

# Try to import Stream Chat, but don't fail if not available
try:
    from stream_chat import StreamChat
    STREAM_AVAILABLE = True
except ImportError:
    STREAM_AVAILABLE = False
    print("Warning: stream-chat not installed. Stream endpoints will return 501.")

STREAM_API_KEY = os.getenv("STREAM_API_KEY")
STREAM_API_SECRET = os.getenv("STREAM_API_SECRET")

if STREAM_AVAILABLE and STREAM_API_KEY and STREAM_API_SECRET:
    server_client = StreamChat(api_key=STREAM_API_KEY, api_secret=STREAM_API_SECRET)
else:
    server_client = None

@router.post("/token")
async def create_token(user_id: str):
    if not STREAM_AVAILABLE:
        raise HTTPException(status_code=501, detail="Stream Chat not configured")
    if not server_client:
        raise HTTPException(status_code=503, detail="Stream Chat not available")
    
    try:
        token = server_client.create_token(user_id)
        return {"token": token, "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/channel")
async def create_channel(session_id: str, user1_id: str, user2_id: str):
    if not STREAM_AVAILABLE:
        raise HTTPException(status_code=501, detail="Stream Chat not configured")
    if not server_client:
        raise HTTPException(status_code=503, detail="Stream Chat not available")
    
    try:
        channel = server_client.channel("messaging", session_id, {
            "name": f"Chat Session {session_id}",
            "members": [user1_id, user2_id],
            "created_by_id": user1_id
        })
        
        await channel.create()
        return {"channel_id": channel.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
