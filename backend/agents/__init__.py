"""
AI Agents Package (Phase 4)
"""
from .base_agent import MCPAgent, AgentCapabilities, AgentTools
from .orchestrator import AgentOrchestrator, orchestrator
from .habit_parser_agent import HabitParserAgent
from .scheduling_agent import SchedulingAgent
from .capacity_optimizer_agent import CapacityOptimizerAgent
from .analytics_agent import AnalyticsAgent

__all__ = [
    'MCPAgent',
    'AgentCapabilities',
    'AgentTools',
    'AgentOrchestrator',
    'orchestrator',
    'HabitParserAgent',
    'SchedulingAgent',
    'CapacityOptimizerAgent',
    'AnalyticsAgent'
]
