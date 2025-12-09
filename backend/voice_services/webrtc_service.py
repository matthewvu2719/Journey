"""
WebRTC Service for browser-based voice calls
Handles signaling and media streaming
"""
import asyncio
import json
from typing import Dict, Optional, Set
from datetime import datetime
import uuid

class WebRTCSession:
    """Represents a WebRTC call session"""
    
    def __init__(self, session_id: str, user_id: str):
        self.session_id = session_id
        self.user_id = user_id
        self.created_at = datetime.now()
        self.is_active = True
        self.transcript = []
        self.audio_chunks = []
    
    def add_transcript(self, speaker: str, text: str):
        """Add to conversation transcript"""
        self.transcript.append({
            "timestamp": datetime.now().isoformat(),
            "speaker": speaker,
            "text": text
        })
    
    def get_duration(self) -> int:
        """Get call duration in seconds"""
        return int((datetime.now() - self.created_at).total_seconds())


class WebRTCService:
    """Manages WebRTC connections and sessions"""
    
    def __init__(self):
        self.active_sessions: Dict[str, WebRTCSession] = {}
        self.websocket_connections: Dict[str, Set] = {}  # session_id -> set of websockets
        print("✓ WebRTC Service initialized")
    
    def create_session(self, user_id: str) -> str:
        """
        Create a new WebRTC session
        
        Returns:
            session_id
        """
        session_id = str(uuid.uuid4())
        session = WebRTCSession(session_id, user_id)
        self.active_sessions[session_id] = session
        self.websocket_connections[session_id] = set()
        
        print(f"📞 Created WebRTC session {session_id} for user {user_id}")
        return session_id
    
    def get_session(self, session_id: str) -> Optional[WebRTCSession]:
        """Get session by ID"""
        return self.active_sessions.get(session_id)
    
    def end_session(self, session_id: str) -> Optional[Dict]:
        """
        End a WebRTC session and return call log
        
        Returns:
            Call log data
        """
        session = self.active_sessions.get(session_id)
        if not session:
            return None
        
        session.is_active = False
        
        call_log = {
            "session_id": session_id,
            "user_id": session.user_id,
            "duration_seconds": session.get_duration(),
            "transcript": session.transcript,
            "call_method": "webrtc",
            "call_outcome": "completed"
        }
        
        # Clean up
        del self.active_sessions[session_id]
        if session_id in self.websocket_connections:
            del self.websocket_connections[session_id]
        
        print(f"📞 Ended WebRTC session {session_id}")
        return call_log
    
    async def handle_websocket(self, websocket, session_id: str):
        """
        Handle WebSocket connection for a session
        Manages signaling and data channels
        """
        if session_id not in self.websocket_connections:
            await websocket.send(json.dumps({
                "type": "error",
                "message": "Invalid session"
            }))
            return
        
        # Add to connections
        self.websocket_connections[session_id].add(websocket)
        
        try:
            async for message in websocket:
                data = json.loads(message)
                await self._handle_message(session_id, data, websocket)
        finally:
            # Remove from connections
            self.websocket_connections[session_id].discard(websocket)
    
    async def _handle_message(self, session_id: str, data: Dict, websocket):
        """Handle incoming WebSocket message"""
        msg_type = data.get("type")
        
        if msg_type == "offer":
            # WebRTC offer from client
            await self._handle_offer(session_id, data, websocket)
        
        elif msg_type == "ice-candidate":
            # ICE candidate from client
            await self._handle_ice_candidate(session_id, data, websocket)
        
        elif msg_type == "audio":
            # Audio data from client
            await self._handle_audio(session_id, data)
        
        elif msg_type == "end":
            # End call
            self.end_session(session_id)
    
    async def _handle_offer(self, session_id: str, data: Dict, websocket):
        """Handle WebRTC offer"""
        # In production, create answer using aiortc
        # For now, send acknowledgment
        await websocket.send(json.dumps({
            "type": "answer",
            "sdp": "mock_answer_sdp"  # Replace with real SDP answer
        }))
    
    async def _handle_ice_candidate(self, session_id: str, data: Dict, websocket):
        """Handle ICE candidate"""
        # Process ICE candidate
        pass
    
    async def _handle_audio(self, session_id: str, data: Dict):
        """Handle incoming audio data"""
        session = self.get_session(session_id)
        if not session:
            return
        
        # Store audio chunk
        audio_data = data.get("audio")
        if audio_data:
            session.audio_chunks.append(audio_data)
    
    async def send_audio(self, session_id: str, audio_bytes: bytes):
        """Send audio to client"""
        if session_id not in self.websocket_connections:
            return
        
        # Send to all connected websockets for this session
        message = json.dumps({
            "type": "audio",
            "audio": audio_bytes.hex()  # Convert to hex for JSON
        })
        
        for ws in self.websocket_connections[session_id]:
            try:
                await ws.send(message)
            except Exception as e:
                print(f"Error sending audio: {e}")


# Singleton instance
_webrtc_service: Optional[WebRTCService] = None

def get_webrtc_service() -> WebRTCService:
    """Get or create WebRTC service singleton"""
    global _webrtc_service
    if _webrtc_service is None:
        _webrtc_service = WebRTCService()
    return _webrtc_service
