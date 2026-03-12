from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

# Create router with prefix
router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/replay/enable")
async def enable_replay_protection(request: Request) -> Dict[str, Any]:
    """
    Enable replay protection at runtime.
    Can be called without restarting the server.
    """
    # Access app state through request
    app = request.app
    
    if not hasattr(app.state, 'manager'):
        raise HTTPException(status_code=500, detail="WebSocket manager not available")
    
    if not hasattr(app.state.manager, 'message_handler'):
        raise HTTPException(status_code=500, detail="Message handler not available")
    
    # Enable replay protection
    app.state.manager.message_handler.enable_replay_protection()
    
    return {
        "status": "enabled",
        "message": "Replay protection is now ACTIVE",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.post("/replay/disable")
async def disable_replay_protection(request: Request) -> Dict[str, Any]:
    """
    Disable replay protection at runtime.
    Provides instant rollback capability if issues are detected.
    """
    app = request.app
    
    if not hasattr(app.state, 'manager'):
        raise HTTPException(status_code=500, detail="WebSocket manager not available")
    
    if not hasattr(app.state.manager, 'message_handler'):
        raise HTTPException(status_code=500, detail="Message handler not available")
    
    # Disable replay protection
    app.state.manager.message_handler.disable_replay_protection()
    
    return {
        "status": "disabled",
        "message": "Replay protection is now OFF",
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/replay/status")
async def replay_status(request: Request) -> Dict[str, Any]:
    """
    Get current replay protection status and statistics.
    """
    app = request.app
    
    if not hasattr(app.state, 'manager'):
        raise HTTPException(status_code=500, detail="WebSocket manager not available")
    
    if not hasattr(app.state.manager, 'message_handler'):
        raise HTTPException(status_code=500, detail="Message handler not available")
    
    handler = app.state.manager.message_handler
    
    return {
        "enabled": handler.is_replay_protection_enabled(),
        "stats": handler.replay.get_stats(),
        "message": f"Replay protection is {'ACTIVE' if handler.is_replay_protection_enabled() else 'OFF'}"
    }

@router.get("/replay/stats/{session_id}")
async def session_stats(session_id: str, request: Request) -> Dict[str, Any]:
    """
    Get replay protection statistics for a specific session.
    """
    app = request.app
    
    if not hasattr(app.state, 'manager'):
        raise HTTPException(status_code=500, detail="WebSocket manager not available")
    
    if not hasattr(app.state.manager, 'message_handler'):
        raise HTTPException(status_code=500, detail="Message handler not available")
    
    handler = app.state.manager.message_handler
    
    return handler.replay.get_stats(session_id)

@router.post("/replay/cleanup/{session_id}")
async def cleanup_session(session_id: str, request: Request) -> Dict[str, Any]:
    """
    Manually trigger cleanup for a session.
    Useful for testing and maintenance.
    """
    app = request.app
    
    if not hasattr(app.state, 'manager'):
        raise HTTPException(status_code=500, detail="WebSocket manager not available")
    
    if not hasattr(app.state.manager, 'message_handler'):
        raise HTTPException(status_code=500, detail="Message handler not available")
    
    handler = app.state.manager.message_handler
    handler.cleanup_session(session_id)
    
    return {
        "status": "cleaned",
        "session_id": session_id,
        "message": f"Session {session_id} cleaned up"
    }

# Import datetime for timestamps
from datetime import datetime
