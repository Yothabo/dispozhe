from fastapi import APIRouter, HTTPException
from stream_chat import StreamChat
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/stream", tags=["stream"])

STREAM_API_KEY = os.getenv("STREAM_API_KEY")
STREAM_API_SECRET = os.getenv("STREAM_API_SECRET")

if not STREAM_API_KEY or not STREAM_API_SECRET:
    raise Exception("Stream API credentials not set")

server_client = StreamChat(api_key=STREAM_API_KEY, api_secret=STREAM_API_SECRET)

@router.post("/token")
async def create_token(user_id: str):
    try:
        token = server_client.create_token(user_id)
        return {"token": token, "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/channel")
async def create_channel(session_id: str, user1_id: str, user2_id: str):
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
