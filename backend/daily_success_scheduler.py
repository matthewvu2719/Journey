#!/usr/bin/env python3
"""
Daily Success Rate Scheduler

Automatically calculates and stores daily success rates at the end of each day (after 23:00).
This service runs as a background task and stores final success rates for completed days.
"""

import asyncio
import schedule
import time
from datetime import datetime, date, timedelta
from typing import List
from database import SupabaseClient


class DailySuccessScheduler:
    """Scheduler for calculating and storing daily success rates"""
    
    def __init__(self, db: SupabaseClient):
        self.db = db
        self.is_running = False
    
    def calculate_yesterday_success_rates(self):
        """Calculate and store success rates for yesterday (completed day)"""
        yesterday = date.today() - timedelta(days=1)
        yesterday_str = yesterday.isoformat()
        
        print(f"📊 Calculating daily success rates for {yesterday_str}")
        
        try:
            # Get all users who had habits yesterday
            # For now, we'll use a simple approach - get all users from habits table
            # In production, you might want a more efficient way to get active users
            
            # Get unique user IDs from recent completions or habits
            users = self._get_active_users(yesterday_str)
            
            success_count = 0
            for user_id in users:
                try:
                    result = self.db.calculate_and_store_daily_success_rate(user_id, yesterday_str)
                    if result:
                        success_count += 1
                        print(f"  ✅ Stored success rate for user {user_id}: {result.get('success_rate', 0)}%")
                    else:
                        print(f"  ⚠️  No data for user {user_id} on {yesterday_str}")
                except Exception as e:
                    print(f"  ❌ Error calculating for user {user_id}: {e}")
            
            print(f"📈 Successfully processed {success_count} users for {yesterday_str}")
            
        except Exception as e:
            print(f"❌ Error in daily success rate calculation: {e}")
    
    def _get_active_users(self, target_date: str) -> List[str]:
        """Get list of users who were active on the target date"""
        try:
            # Get users who had completions on this date
            if self.db.mock_mode:
                if hasattr(self.db, 'mock_completions'):
                    users = set()
                    for completion in self.db.mock_completions:
                        if completion.get('completed_date') == target_date:
                            users.add(completion.get('user_id', 'default_user'))
                    return list(users)
                return ['default_user']  # Fallback for mock mode
            else:
                # Query Supabase for users with completions on target date
                result = self.db.client.table('habit_completions')\
                    .select('user_id')\
                    .eq('completed_date', target_date)\
                    .execute()
                
                if result.data:
                    users = set(row['user_id'] for row in result.data)
                    return list(users)
                
                # Fallback: get users who have habits (they might have 0% success rate)
                habits_result = self.db.client.table('habits').select('user_id').execute()
                if habits_result.data:
                    users = set(row['user_id'] for row in habits_result.data)
                    return list(users)
                
                return []
        except Exception as e:
            print(f"Error getting active users: {e}")
            return ['default_user']  # Fallback
    
    def start_scheduler(self):
        """Start the daily success rate scheduler"""
        print("🚀 Starting Daily Success Rate Scheduler")
        
        # Schedule the job to run at 23:30 every day (30 minutes before midnight)
        schedule.every().day.at("23:30").do(self.calculate_yesterday_success_rates)
        
        # Also schedule for 00:05 (5 minutes after midnight) as a backup
        schedule.every().day.at("00:05").do(self.calculate_yesterday_success_rates)
        
        self.is_running = True
        
        print("⏰ Scheduled daily success rate calculation for 23:30 and 00:05")
        print("📅 Next run:", schedule.next_run())
        
        # Run the scheduler loop
        while self.is_running:
            schedule.run_pending()
            time.sleep(60)  # Check every minute
    
    def stop_scheduler(self):
        """Stop the scheduler"""
        print("🛑 Stopping Daily Success Rate Scheduler")
        self.is_running = False
        schedule.clear()
    
    def run_manual_calculation(self, target_date: str = None):
        """Manually run success rate calculation for a specific date"""
        if not target_date:
            yesterday = date.today() - timedelta(days=1)
            target_date = yesterday.isoformat()
        
        print(f"🔧 Manual calculation for {target_date}")
        
        # Temporarily override the calculation to use the specified date
        original_method = self.calculate_yesterday_success_rates
        
        def manual_calculation():
            users = self._get_active_users(target_date)
            success_count = 0
            
            for user_id in users:
                try:
                    result = self.db.calculate_and_store_daily_success_rate(user_id, target_date)
                    if result:
                        success_count += 1
                        print(f"  ✅ Stored success rate for user {user_id}: {result.get('success_rate', 0)}%")
                except Exception as e:
                    print(f"  ❌ Error calculating for user {user_id}: {e}")
            
            print(f"📈 Manually processed {success_count} users for {target_date}")
        
        manual_calculation()


# Async version for integration with FastAPI
class AsyncDailySuccessScheduler:
    """Async version of the daily success scheduler for FastAPI integration"""
    
    def __init__(self, db: SupabaseClient):
        self.db = db
        self.scheduler_task = None
    
    async def start(self):
        """Start the async scheduler"""
        if self.scheduler_task is None:
            print("🚀 Starting Async Daily Success Rate Scheduler")
            self.scheduler_task = asyncio.create_task(self._scheduler_loop())
    
    async def stop(self):
        """Stop the async scheduler"""
        if self.scheduler_task:
            print("🛑 Stopping Async Daily Success Rate Scheduler")
            self.scheduler_task.cancel()
            try:
                await self.scheduler_task
            except asyncio.CancelledError:
                pass
            self.scheduler_task = None
    
    async def _scheduler_loop(self):
        """Main scheduler loop"""
        while True:
            try:
                now = datetime.now()
                
                # Check if it's time to run (23:30 or 00:05)
                if (now.hour == 23 and now.minute == 30) or (now.hour == 0 and now.minute == 5):
                    await self._calculate_yesterday_success_rates()
                
                # Sleep for 60 seconds before next check
                await asyncio.sleep(60)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in scheduler loop: {e}")
                await asyncio.sleep(60)
    
    async def _calculate_yesterday_success_rates(self):
        """Async version of success rate calculation"""
        yesterday = date.today() - timedelta(days=1)
        yesterday_str = yesterday.isoformat()
        
        print(f"📊 [ASYNC] Calculating daily success rates for {yesterday_str}")
        
        try:
            # Run the synchronous calculation in a thread pool
            loop = asyncio.get_event_loop()
            
            def sync_calculation():
                scheduler = DailySuccessScheduler(self.db)
                scheduler.run_manual_calculation(yesterday_str)
            
            await loop.run_in_executor(None, sync_calculation)
            
        except Exception as e:
            print(f"❌ [ASYNC] Error in daily success rate calculation: {e}")


# Standalone script for manual testing
if __name__ == "__main__":
    import sys
    
    # Initialize database
    db = SupabaseClient()
    scheduler = DailySuccessScheduler(db)
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "manual":
            # Manual calculation for yesterday
            target_date = sys.argv[2] if len(sys.argv) > 2 else None
            scheduler.run_manual_calculation(target_date)
        elif sys.argv[1] == "start":
            # Start the scheduler
            try:
                scheduler.start_scheduler()
            except KeyboardInterrupt:
                scheduler.stop_scheduler()
                print("👋 Scheduler stopped")
    else:
        print("Usage:")
        print("  python daily_success_scheduler.py manual [YYYY-MM-DD]  # Manual calculation")
        print("  python daily_success_scheduler.py start               # Start scheduler")