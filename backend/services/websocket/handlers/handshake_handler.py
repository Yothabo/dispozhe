from fastapi import WebSocket
import json
import logging
from datetime import datetime
from typing import Dict, Optional, Tuple
from utils.tokens import generate_fingerprint, generate_participant_id, verify_compatibility

logger = logging.getLogger(__name__)

class HandshakeHandler:
    """Handles secure join handshake with identity exchange"""
    
    def __init__(self):
        self.pending_handshakes = {}  # session_id -> {websocket_id: handshake_data}
        self.completed_handshakes = set()  # session_id that completed handshake
        
    async def initiate_handshake(self, websocket: WebSocket, session_id: str, 
                                 client_version: str, supported_features: Dict[str, bool]) -> Dict:
        """
        Initiate handshake with a new client.
        Returns handshake data including fingerprint.
        """
        # Generate anonymous fingerprint for this participant
        fingerprint = generate_fingerprint()
        participant_id = generate_participant_id(session_id, fingerprint)
        
        # Store handshake data
        websocket_id = id(websocket)
        if session_id not in self.pending_handshakes:
            self.pending_handshakes[session_id] = {}
            
        self.pending_handshakes[session_id][websocket_id] = {
            "fingerprint": fingerprint,
            "participant_id": participant_id,
            "client_version": client_version,
            "supported_features": supported_features,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "pending"
        }
        
        logger.info(f"[Handshake] Initiated for session {session_id}, participant {participant_id}")
        
        return {
            "type": "handshake_init",
            "session_id": session_id,
            "fingerprint": fingerprint,
            "participant_id": participant_id,
            "server_version": "1.0.0",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def complete_handshake(self, websocket: WebSocket, session_id: str, 
                                peer_fingerprint: str) -> Tuple[bool, Optional[Dict]]:
        """
        Complete handshake with peer information exchange.
        Returns success status and peer info if available.
        """
        websocket_id = id(websocket)
        
        # Check if this websocket has pending handshake
        if session_id not in self.pending_handshakes:
            logger.warning(f"[Handshake] No pending handshake for session {session_id}")
            return False, None
            
        if websocket_id not in self.pending_handshakes[session_id]:
            logger.warning(f"[Handshake] No pending handshake for websocket in {session_id}")
            return False, None
        
        # Mark this participant's handshake as complete
        self.pending_handshakes[session_id][websocket_id]["status"] = "completed"
        self.pending_handshakes[session_id][websocket_id]["peer_fingerprint"] = peer_fingerprint
        
        # Check if both participants have completed handshake
        all_completed = all(
            data["status"] == "completed" 
            for data in self.pending_handshakes[session_id].values()
        )
        
        if all_completed and len(self.pending_handshakes[session_id]) == 2:
            self.completed_handshakes.add(session_id)
            logger.info(f"[Handshake] Session {session_id} handshake complete")
            
            # Get peer info for this websocket
            peer_info = None
            for wid, data in self.pending_handshakes[session_id].items():
                if wid != websocket_id:
                    peer_info = {
                        "fingerprint": data["fingerprint"],
                        "participant_id": data["participant_id"],
                        "client_version": data["client_version"],
                        "supported_features": data["supported_features"]
                    }
                    break
            
            return True, peer_info
        
        return True, None  # Handshake recorded, waiting for peer
    
    async def exchange_identities(self, session_id: str) -> Optional[Dict]:
        """
        Exchange identities between participants when both are ready.
        Returns mapping of websocket_id -> peer_info for both participants.
        """
        if session_id not in self.completed_handshakes:
            return None
            
        if session_id not in self.pending_handshakes:
            return None
            
        participants = self.pending_handshakes[session_id]
        if len(participants) != 2:
            return None
            
        # Create identity exchange map
        websocket_ids = list(participants.keys())
        
        exchange_data = {
            websocket_ids[0]: {
                "peer": participants[websocket_ids[1]],
                "self": participants[websocket_ids[0]]
            },
            websocket_ids[1]: {
                "peer": participants[websocket_ids[0]],
                "self": participants[websocket_ids[1]]
            }
        }
        
        logger.info(f"[Handshake] Identities exchanged for session {session_id}")
        return exchange_data
    
    def get_participant_info(self, session_id: str, websocket: WebSocket) -> Optional[Dict]:
        """Get participant info for a websocket"""
        websocket_id = id(websocket)
        if session_id in self.pending_handshakes:
            return self.pending_handshakes[session_id].get(websocket_id)
        return None
    
    def cleanup_session(self, session_id: str):
        """Clean up handshake data for a session"""
        if session_id in self.pending_handshakes:
            del self.pending_handshakes[session_id]
        if session_id in self.completed_handshakes:
            self.completed_handshakes.remove(session_id)
        logger.info(f"[Handshake] Cleaned up session {session_id}")
