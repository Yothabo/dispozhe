import os
import logging
from fastapi import APIRouter, HTTPException
from dotenv import load_dotenv
import time

logger = logging.getLogger(__name__)
load_dotenv()

router = APIRouter(prefix="/stream", tags=["stream"])

logger.info(f"STREAM_API_KEY exists: {bool(os.getenv('STREAM_API_KEY'))}")
logger.info(f"STREAM_API_SECRET exists: {bool(os.getenv('STREAM_API_SECRET'))}")

try:
    from stream_chat import StreamChat
    STREAM_AVAILABLE = True
    logger.info("Successfully imported stream_chat")
except ImportError as e:
    STREAM_AVAILABLE = False
    logger.error(f"Failed to import stream_chat: {e}")

STREAM_API_KEY = os.getenv("STREAM_API_KEY")
STREAM_API_SECRET = os.getenv("STREAM_API_SECRET")

if STREAM_AVAILABLE and STREAM_API_KEY and STREAM_API_SECRET:
    try:
        # Initialize with both key and secret
        server_client = StreamChat(api_key=STREAM_API_KEY, api_secret=STREAM_API_SECRET)
        logger.info("Successfully initialized StreamChat client")
    except Exception as e:
        server_client = None
        logger.error(f"Failed to initialize StreamChat client: {e}")
else:
    server_client = None
    if not STREAM_AVAILABLE:
        logger.error("StreamChat module not available")
    if not STREAM_API_KEY:
        logger.error("STREAM_API_KEY not set")
    if not STREAM_API_SECRET:
        logger.error("STREAM_API_SECRET not set")

@router.post("/token")
async def create_token(user_id: str):
    logger.info(f"Token request for user: {user_id}")
    
    if not STREAM_AVAILABLE:
        logger.error("Stream Chat not configured (import failed)")
        raise HTTPException(status_code=501, detail="Stream Chat not configured")
    
    if not server_client:
        logger.error("Stream Chat not available (client not initialized)")
        raise HTTPException(status_code=503, detail="Stream Chat not available")

    try:
        # Create token with proper expiration (24 hours)
        token = server_client.create_token(user_id, exp_seconds=24*60*60)
        logger.info(f"Token created for user: {user_id}")
        
        # Verify the token works by decoding it
        # This is optional but helps debug
        try:
            decoded = server_client.decode_token(token)
            logger.info(f"Token decoded successfully, expires: {decoded.get('exp')}")
        except Exception as decode_err:
            logger.error(f"Token decode failed: {decode_err}")
            
        return {"token": token, "user_id": user_id}
    except Exception as e:
        logger.error(f"Token creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/channel")
async def create_channel(session_id: str, user1_id: str, user2_id: str):
    logger.info(f"Channel request for session: {session_id}")
    
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
        logger.info(f"Channel created for session: {session_id}")
        return {"channel_id": channel.id}
    except Exception as e:
        logger.error(f"Channel creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
