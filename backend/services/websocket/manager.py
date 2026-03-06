"""Main WebSocket manager - facade for all components"""
from .storage.connection_store import ConnectionStore
from .storage.message_store import MessageStore
from .handlers.message_handler import MessageHandler
from .handlers.connection_handler import ConnectionHandler

class WebSocketManager:
    """Facade for WebSocket management"""
    
    def __init__(self):
        self.connection_store = ConnectionStore()
        self.message_store = MessageStore()
        self.message_handler = MessageHandler(self.connection_store, self.message_store)
        self.connection_handler = ConnectionHandler(self.connection_store, self.message_handler)
    
    # Delegate connection methods
    async def connect(self, websocket, session_id):
        return await self.connection_handler.connect(websocket, session_id)
    
    async def disconnect(self, websocket, session_id):
        await self.connection_handler.disconnect(websocket)
    
    async def terminate_session(self, session_id):
        await self.connection_handler.terminate_session(session_id)
        self.message_store.cleanup_session(session_id)
    
    def get_connection_count(self, session_id):
        return self.connection_store.get_count(session_id)
    
    # Delegate message methods
    async def send_message(self, session_id, message_data, sender_ws):
        return await self.message_handler.send_message(session_id, message_data, sender_ws)
    
    async def broadcast_to_session(self, session_id, message, exclude=None):
        await self.message_handler.broadcast(session_id, message, exclude)
    
    async def handle_file_viewed(self, session_id, file_id, viewer_ws):
        return await self.message_handler.handle_file_viewed(session_id, file_id, viewer_ws)
    
    async def mark_as_read(self, session_id, message_id, reader_ws):
        # Implement if needed
        pass
    
    def set_expiry_service(self, expiry_service):
        # For compatibility
        pass
