"""
Base Agent Class for MCP (Model Context Protocol) Framework
Phase 4: AI Agents Architecture
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)


class MCPAgent(ABC):
    """
    Base class for all MCP agents
    Provides common functionality for context management, tool usage, and communication
    """
    
    def __init__(self, name: str, capabilities: List[str], tools: Optional[List[str]] = None):
        self.name = name
        self.capabilities = capabilities
        self.tools = tools or []
        self.context = {}
        self.conversation_history = []
        self.created_at = datetime.now()
        self.last_active = datetime.now()
    
    @abstractmethod
    async def process_request(self, request: Dict[str, Any], user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main processing method - must be implemented by each agent
        
        Args:
            request: The user request with intent, parameters, etc.
            user_context: User-specific context (preferences, history, etc.)
            
        Returns:
            Dict with response, actions, and metadata
        """
        pass
    
    def update_context(self, key: str, value: Any) -> None:
        """Update agent context"""
        self.context[key] = value
        self.last_active = datetime.now()
    
    def get_context(self, key: str, default: Any = None) -> Any:
        """Get value from agent context"""
        return self.context.get(key, default)
    
    def add_to_history(self, message: Dict[str, Any]) -> None:
        """Add message to conversation history"""
        message['timestamp'] = datetime.now().isoformat()
        self.conversation_history.append(message)
        
        # Keep only last 50 messages to prevent memory issues
        if len(self.conversation_history) > 50:
            self.conversation_history = self.conversation_history[-50:]
    
    def get_recent_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent conversation history"""
        return self.conversation_history[-limit:] if self.conversation_history else []
    
    def can_handle(self, request_type: str) -> bool:
        """Check if agent can handle a specific request type"""
        return request_type in self.capabilities
    
    def get_status(self) -> Dict[str, Any]:
        """Get agent status information"""
        return {
            "name": self.name,
            "capabilities": self.capabilities,
            "tools": self.tools,
            "active": True,
            "last_active": self.last_active.isoformat(),
            "context_size": len(self.context),
            "history_size": len(self.conversation_history)
        }
    
    def format_response(self, 
                      content: str, 
                      actions: Optional[List[Dict[str, Any]]] = None,
                      suggestions: Optional[List[str]] = None,
                      metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Format a standardized response
        """
        response = {
            "agent": self.name,
            "content": content,
            "timestamp": datetime.now().isoformat(),
            "success": True
        }
        
        if actions:
            response["actions"] = actions
        
        if suggestions:
            response["suggestions"] = suggestions
        
        if metadata:
            response["metadata"] = metadata
        
        return response
    
    def format_error(self, error_message: str, error_code: Optional[str] = None) -> Dict[str, Any]:
        """Format an error response"""
        return {
            "agent": self.name,
            "success": False,
            "error": error_message,
            "error_code": error_code,
            "timestamp": datetime.now().isoformat()
        }


class AgentCapabilities:
    """Constants for agent capabilities"""
    
    # Scheduling capabilities
    SCHEDULE_OPTIMIZATION = "schedule_optimization"
    CONFLICT_DETECTION = "conflict_detection"
    CONFLICT_RESOLUTION = "conflict_resolution"
    TIME_MANAGEMENT = "time_management"
    
    # Natural Language Processing
    HABIT_PARSING = "habit_parsing"
    INTENT_RECOGNITION = "intent_recognition"
    TEXT_ANALYSIS = "text_analysis"
    CONVERSATION = "conversation"
    
    # Analytics and Insights
    PROGRESS_ANALYSIS = "progress_analysis"
    PATTERN_RECOGNITION = "pattern_recognition"
    RECOMMENDATIONS = "recommendations"
    INSIGHTS_GENERATION = "insights_generation"
    
    # Data Management
    DATA_RETRIEVAL = "data_retrieval"
    DATA_CREATION = "data_creation"
    DATA_UPDATE = "data_update"
    
    # Communication
    CHAT_RESPONSE = "chat_response"
    EXPLANATION = "explanation"
    MOTIVATION = "motivation"


class AgentTools:
    """Constants for agent tools"""
    
    # Database tools
    GET_HABITS = "get_habits"
    CREATE_HABIT = "create_habit"
    UPDATE_HABIT = "update_habit"
    GET_SCHEDULE = "get_schedule"
    CREATE_EVENT = "create_event"
    
    # Timetable tools
    GENERATE_SCHEDULE = "generate_schedule"
    DETECT_CONFLICTS = "detect_conflicts"
    RESOLVE_CONFLICTS = "resolve_conflicts"
    OPTIMIZE_SCHEDULE = "optimize_schedule"
    
    # AI/ML tools
    ANALYZE_TEXT = "analyze_text"
    EXTRACT_INTENT = "extract_intent"
    GENERATE_RESPONSE = "generate_response"
    CLASSIFY_TEXT = "classify_text"
    
    # Analytics tools
    CALCULATE_STATS = "calculate_stats"
    IDENTIFY_PATTERNS = "identify_patterns"
    GENERATE_INSIGHTS = "generate_insights"
