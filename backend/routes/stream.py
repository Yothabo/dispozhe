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
        server_client = StreamChat(api_key=STREAM_API_KEY, api_secret=STREAM_API_SECRET)
        logger.info("Successfully initialized StreamChat client")
    except Exception as e:
        server_client = None
        logger.error(f"Failed to initialize StreamChat client: {e}")
else:
    server_client = None

@router.post("/token")
async def create_token(user_id: str):
    logger.info(f"Token request for user: {user_id}")
    
    if not STREAM_AVAILABLE:
        raise HTTPException(status_code=501, detail="Stream Chat not configured")
    if not server_client:
        raise HTTPException(status_code=503, detail="Stream Chat not available")

    try:
        # Create the user first (upsert)
        server_client.upsert_user({
            "id": user_id,
            "name": f"User_{user_id[:4]}",
            "role": "user"
        })
        logger.info(f"User created/updated: {user_id}")
        
        # Create token
        token = server_client.create_token(user_id, exp_seconds=24*60*60)
        logger.info(f"Token created for user: {user_id}")
        
        return {"token": token, "user_id": user_id}
    except Exception as e:
        logger.error(f"Token creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/channel")
async def create_channel(session_id: str, user1_id: str, user2_id: str):
    logger.info(f"Channel request for session: {session_id}, users: {user1_id}, {user2_id}")
    
    if not STREAM_AVAILABLE:
        raise HTTPException(status_code=501, detail="Stream Chat not configured")
    if not server_client:
        raise HTTPException(status_code=503, detail="Stream Chat not available")

    try:
        # Ensure both users exist
        server_client.upsert_user({
            "id": user1_id,
            "name": f"User_{user1_id[:4]}",
            "role": "user"
        })
        server_client.upsert_user({
            "id": user2_id,
            "name": f"User_{user2_id[:4]}",
            "role": "user"
        })
        logger.info(f"Both users created/updated: {user1_id}, {user2_id}")

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
