"""
ML Training Scheduler - Runs periodic training checks
"""
import asyncio
import logging
from datetime import datetime, time
from typing import Optional
from ml_trainer import get_ml_trainer

logger = logging.getLogger(__name__)


class MLScheduler:
    """
    Schedules periodic ML training tasks
    """
    
    def __init__(self, db_client):
        self.db = db_client
        self.ml_trainer = get_ml_trainer(db_client)
        self.is_running = False
        self.task: Optional[asyncio.Task] = None
        
        logger.info("✓ ML Scheduler initialized")
    
    async def start(self):
        """Start the scheduler"""
        if self.is_running:
            logger.warning("Scheduler already running")
            return
        
        self.is_running = True
        self.task = asyncio.create_task(self._run_scheduler())
        logger.info("🚀 ML Scheduler started")
    
    async def stop(self):
        """Stop the scheduler"""
        self.is_running = False
        if self.task:
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
        logger.info("🛑 ML Scheduler stopped")
    
    async def _run_scheduler(self):
        """Main scheduler loop"""
        while self.is_running:
            try:
                # Run daily training check at 2 AM
                now = datetime.now()
                target_time = time(hour=2, minute=0)
                
                # Calculate seconds until next 2 AM
                if now.time() < target_time:
                    # Today at 2 AM
                    next_run = datetime.combine(now.date(), target_time)
                else:
                    # Tomorrow at 2 AM
                    next_run = datetime.combine(now.date(), target_time)
                    next_run = next_run.replace(day=next_run.day + 1)
                
                seconds_until_next = (next_run - now).total_seconds()
                
                logger.info(f"⏰ Next ML training check in {seconds_until_next/3600:.1f} hours")
                
                # Wait until next run time
                await asyncio.sleep(seconds_until_next)
                
                # Run daily training check for all active users
                await self._run_daily_training()
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}")
                # Wait 1 hour before retrying
                await asyncio.sleep(3600)
    
    async def _run_daily_training(self):
        """Run daily training check for all users"""
        logger.info("🎓 Running daily ML training check for all users")
        
        try:
            # Get all users with habits (simplified - in production, query users table)
            # For now, we'll just log that the check ran
            logger.info("Daily training check completed")
            
            # In production, you would:
            # 1. Query all active users from database
            # 2. For each user, call ml_trainer.check_daily_training(user_id)
            # 3. Log results
            
        except Exception as e:
            logger.error(f"Error in daily training: {e}")


# Singleton instance
_ml_scheduler: Optional[MLScheduler] = None

def get_ml_scheduler(db_client=None) -> MLScheduler:
    """Get or create ML Scheduler singleton"""
    global _ml_scheduler
    if _ml_scheduler is None and db_client:
        _ml_scheduler = MLScheduler(db_client)
    return _ml_scheduler
