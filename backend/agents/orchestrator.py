"""
Agent Orchestrator for MCP Framework
Coordinates multiple agents and routes requests
Phase 4: AI Agents Architecture
"""
from typing import Dict, List, Any, Optional
import asyncio
import logging
from datetime import datetime

from .base_agent import MCPAgent, AgentCapabilities
from .scheduling_agent import SchedulingAgent
from .habit_parser_agent import HabitParserAgent
from .capacity_optimizer_agent import CapacityOptimizerAgent
from .analytics_agent import AnalyticsAgent

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """
    Orchestrates multiple MCP agents to handle complex requests
    Routes requests to appropriate agents and coordinates multi-agent workflows
    """
    
    def __init__(self):
        self.agents: Dict[str, MCPAgent] = {}
        self.request_history = []
        self.active_conversations = {}
        
        # Initialize agents
        self._initialize_agents()
    
    def _initialize_agents(self):
        """Initialize all available agents"""
        try:
            self.agents = {
                'scheduler': SchedulingAgent(),
                'parser': HabitParserAgent(),
                'optimizer': CapacityOptimizerAgent(),
                'analytics': AnalyticsAgent()
            }
            logger.info(f"Initialized {len(self.agents)} agents")
        except Exception as e:
            logger.error(f"Failed to initialize agents: {e}")
            # Initialize with empty dict to prevent crashes
            self.agents = {}
    
    async def process_request(self, 
                            request: str, 
                            user_id: str,
                            user_context: Optional[Dict[str, Any]] = None,
                            conversation_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Process a user request by routing to appropriate agent(s)
        
        Args:
            request: Natural language request from user
            user_id: User identifier
            user_context: User-specific context and preferences
            conversation_id: Optional conversation identifier for multi-turn chats
            
        Returns:
            Unified response from agent(s)
        """
        try:
            # Analyze request to determine intent and required agents
            intent_analysis = await self._analyze_intent(request)
            
            # Get user context if not provided
            if user_context is None:
                user_context = await self._get_user_context(user_id)
            
            # Route to appropriate agent(s)
            if intent_analysis['requires_multiple_agents']:
                response = await self._handle_multi_agent_request(
                    request, intent_analysis, user_context
                )
            else:
                response = await self._handle_single_agent_request(
                    request, intent_analysis, user_context
                )
            
            # Store request in history
            self._add_to_history({
                'request': request,
                'user_id': user_id,
                'intent': intent_analysis,
                'response': response,
                'timestamp': datetime.now().isoformat()
            })
            
            return response
            
        except Exception as e:
            logger.error(f"Error processing request: {e}")
            return {
                'success': False,
                'error': 'Failed to process request',
                'content': 'I apologize, but I encountered an error processing your request. Please try again.',
                'timestamp': datetime.now().isoformat()
            }
    
    async def _analyze_intent(self, request: str) -> Dict[str, Any]:
        """
        Analyze user request to determine intent and required agents
        Uses Hugging Face models for better intent classification
        """
        # Try to use HF model for intent classification
        try:
            from ..hf_models import classify_intent
            
            candidate_labels = [
                'create_habit',
                'schedule',
                'resolve_conflict',
                'analytics',
                'conversation'
            ]
            
            result = classify_intent(request, candidate_labels)
            primary_intent = result['intent']
            confidence = result['confidence']
            
        except Exception as e:
            logger.warning(f"HF intent classification failed, using fallback: {e}")
            # Fallback to keyword-based
            request_lower = request.lower()
            
            if any(word in request_lower for word in ['create', 'add', 'start', 'begin', 'new habit']):
                primary_intent = 'create_habit'
                confidence = 0.7
            elif any(word in request_lower for word in ['schedule', 'timetable', 'calendar', 'plan', 'organize']):
                primary_intent = 'schedule'
                confidence = 0.7
            elif any(word in request_lower for word in ['capacity', 'overload', 'time budget', 'balance', 'optimize', 'too much', 'too many']):
                primary_intent = 'optimize_capacity'
                confidence = 0.7
            elif any(word in request_lower for word in ['progress', 'stats', 'analysis', 'insights', 'how am i doing']):
                primary_intent = 'analytics'
                confidence = 0.7
            else:
                primary_intent = 'conversation'
                confidence = 0.5
        
        # Map intents to agents
        intent_to_agent = {
            'create_habit': 'parser',
            'schedule': 'scheduler',
            'optimize_capacity': 'optimizer',
            'analytics': 'analytics',
            'conversation': 'parser'
        }
        
        required_agents = [intent_to_agent.get(primary_intent, 'parser')]
        
        return {
            'intents': [primary_intent],
            'required_agents': required_agents,
            'requires_multiple_agents': len(required_agents) > 1,
            'primary_intent': primary_intent,
            'confidence': confidence
        }
    
    async def _handle_single_agent_request(self, 
                                         request: str, 
                                         intent_analysis: Dict[str, Any], 
                                         user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle request that requires only one agent
        """
        agent_name = intent_analysis['required_agents'][0]
        
        if agent_name not in self.agents:
            return {
                'success': False,
                'error': f'Agent {agent_name} not available',
                'content': 'I apologize, but that feature is currently unavailable.'
            }
        
        agent = self.agents[agent_name]
        
        # Prepare request for agent
        agent_request = {
            'text': request,
            'intent': intent_analysis['primary_intent'],
            'intents': intent_analysis['intents']
        }
        
        # Process with agent
        response = await agent.process_request(agent_request, user_context)
        
        return response
    
    async def _handle_multi_agent_request(self, 
                                        request: str, 
                                        intent_analysis: Dict[str, Any], 
                                        user_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle request that requires multiple agents working together
        """
        responses = []
        
        # Process with each required agent
        for agent_name in intent_analysis['required_agents']:
            if agent_name in self.agents:
                agent = self.agents[agent_name]
                
                agent_request = {
                    'text': request,
                    'intent': intent_analysis['primary_intent'],
                    'intents': intent_analysis['intents'],
                    'multi_agent_context': {
                        'other_agents': [a for a in intent_analysis['required_agents'] if a != agent_name],
                        'previous_responses': responses
                    }
                }
                
                response = await agent.process_request(agent_request, user_context)
                responses.append({
                    'agent': agent_name,
                    'response': response
                })
        
        # Combine responses
        return self._combine_agent_responses(responses, intent_analysis)
    
    def _combine_agent_responses(self, 
                               responses: List[Dict[str, Any]], 
                               intent_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """
        Combine responses from multiple agents into a unified response
        """
        if not responses:
            return {
                'success': False,
                'error': 'No agent responses received',
                'content': 'I was unable to process your request.'
            }
        
        combined_content = []
        combined_actions = []
        combined_suggestions = []
        
        for agent_response in responses:
            response = agent_response['response']
            
            if response.get('success') and response.get('content'):
                combined_content.append(response['content'])
            
            if response.get('actions'):
                combined_actions.extend(response['actions'])
            
            if response.get('suggestions'):
                combined_suggestions.extend(response['suggestions'])
        
        return {
            'success': True,
            'content': ' '.join(combined_content),
            'actions': combined_actions,
            'suggestions': list(set(combined_suggestions)),  # Remove duplicates
            'multi_agent': True,
            'agent_responses': responses,
            'timestamp': datetime.now().isoformat()
        }
    
    async def _get_user_context(self, user_id: str) -> Dict[str, Any]:
        """
        Get user context including preferences, history, and current state
        """
        # This would typically fetch from database
        # For now, return basic context
        return {
            'user_id': user_id,
            'preferences': {},
            'timezone': 'UTC',
            'current_habits': [],
            'current_schedule': []
        }
    
    def _add_to_history(self, entry: Dict[str, Any]):
        """Add entry to request history"""
        self.request_history.append(entry)
        
        # Keep only last 100 requests
        if len(self.request_history) > 100:
            self.request_history = self.request_history[-100:]
    
    def get_agent_status(self) -> Dict[str, Any]:
        """Get status of all agents"""
        return {
            'orchestrator': {
                'active': True,
                'agents_count': len(self.agents),
                'request_history_size': len(self.request_history)
            },
            'agents': {name: agent.get_status() for name, agent in self.agents.items()}
        }
    
    async def get_suggestions(self, user_id: str, context: Optional[Dict[str, Any]] = None) -> List[str]:
        """
        Get proactive suggestions for the user
        """
        suggestions = []
        
        # Get suggestions from analytics agent
        if 'analytics' in self.agents:
            analytics_response = await self.agents['analytics'].process_request(
                {'text': 'get_suggestions', 'intent': 'suggestions'},
                context or await self._get_user_context(user_id)
            )
            
            if analytics_response.get('suggestions'):
                suggestions.extend(analytics_response['suggestions'])
        
        return suggestions


# Global orchestrator instance
orchestrator = AgentOrchestrator()
