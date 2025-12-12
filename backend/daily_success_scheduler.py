"""
Daily Success Rate Scheduler
Calculates and stores daily success rates after each day ends (after 23:00)
"""
import asyncio
import schedule
import time
from datetime import datetime, date, timedelta
from database import db
from typing import List


class DailySuccessScheduler:
    """Scheduler for calculating daily success rates"""
    
    def __init__(self):
        self.running = False
    
    def calculate_yesterday_success_rates(self):
        """Calculate success rates for yesterday (after midnight)"""
        yesterday = (datetime.now() - timedelta(days=1)).date()
        
        print(f"Calculating daily success rates for {yesterday}")
        
        try:
            # Get all users who have habits (simplified - in production you'd get from users table)
            # For now, we'll get unique user_ids from habits
            if db.mock_mode:
                user_ids = set()
                if hasattr(db, 'mock_habits'):
                    user_ids = {h.get('user_id') for h in db.mock_habits if h.get('user_id')}
            else:
                # Get unique user_ids from habits table
                result = db.client.table('habits').select('user_id').execute()
                user_ids = {h['user_id'] for h in result.data} if result.data else set()
            
            success_count = 0
            for user_id in user_ids:
                if user_id:
                    result = db.calculate_and_save_daily_success_rate(user_id, yesterday)
                    if result:
                        success_count += 1
                        print(f"✓ Saved success rate for user {user_id}: {result['success_rate']}%")
            
            print(f"✓ Processed {success_count} users for {yesterday}")
            
        except Exception as e:
            print(f"Error calculating daily success rates: {e}")
    
    def get_current_day_success_rate(self, user_id: str) -> dict:
        """Calculate real-time success rate for current day"""
        today = datetime.now().date()
        
        try:
            # Get active habits for today
            habits = db.get_habits(user_id)
            if not habits:
                return {
                    'date': today.isoformat(),
                    'total_instances': 0,
                    'completed_instances': 0,
                    'success_rate': 0.0,
                    'status': 'gray'  # No habits
                }
            
            # Get today's completions
            completions = db.get_completions(
                user_id=user_id,
                start_date=today,
                end_date=today
            )
            
            # Count instances
            total_instances = len(habits)  # Simplified: one instance per habit per day
            completed_instances = len(completions)
            
            success_rate = (completed_instances / total_instances * 100) if total_instances > 0 else 0.0
            
            # Determine status color
            if success_rate == 0:
                status = 'red'
            elif success_rate < 80:
                status = 'yellow'
            else:
                status = 'green'
            
            return {
                'date': today.isoformat(),
                'total_instances': total_instances,
                'completed_instances': completed_instances,
                'success_rate': round(success_rate, 2),
                'status': status,
                'is_current_day': True
            }
            
        except Exception as e:
            print(f"Error calculating current day success rate: {e}")
            return {
                'date': today.isoformat(),
                'total_instances': 0,
                'completed_instances': 0,
                'success_rate': 0.0,
                'status': 'red'
            }
    
    def get_success_rate_for_date(self, user_id: str, target_date: date) -> dict:
        """Get success rate for any date with proper status"""
        today = datetime.now().date()
        
        if target_date == today:
            # Current day - calculate real-time
            return self.get_current_day_success_rate(user_id)
        elif target_date > today:
            # Future date - gray
            return {
                'date': target_date.isoformat(),
                'total_instances': 0,
                'completed_instances': 0,
                'success_rate': 0.0,
                'status': 'gray',
                'is_future_date': True
            }
        else:
            # Past date - get from database
            stored_rate = db.get_daily_success_rate(user_id, target_date)
            
            if stored_rate:
                # Determine status color
                success_rate = stored_rate['success_rate']
                if success_rate == 0:
                    status = 'red'
                elif success_rate < 80:
                    status = 'yellow'
                else:
                    status = 'green'
                
                return {
                    **stored_rate,
                    'status': status,
                    'is_stored': True
                }
            else:
                # No data for past date - calculate and store it
                result = db.calculate_and_save_daily_success_rate(user_id, target_date)
                if result:
                    success_rate = result['success_rate']
                    if success_rate == 0:
                        status = 'red'
                    elif success_rate < 80:
                        status = 'yellow'
                    else:
                        status = 'green'
                    
                    return {
                        **result,
                        'status': status,
                        'is_calculated': True
                    }
                else:
                    return {
                        'date': target_date.isoformat(),
                        'total_instances': 0,
                        'completed_instances': 0,
                        'success_rate': 0.0,
                        'status': 'red'
                    }
    
    def start_scheduler(self):
        """Start the daily scheduler - DISABLED"""
        # Removed: Schedule to run at 00:05 (5 minutes after midnight)
        # This was unreliable for web apps since users don't keep browsers open 24/7
        print("⚠️  Daily success rate scheduler is disabled")
        print("   Success rates will be calculated on-demand instead")
    
    def stop_scheduler(self):
        """Stop the scheduler"""
        self.running = False
        schedule.clear()
        print("✓ Daily success rate scheduler stopped")
    
    async def start_async_scheduler(self):
        """Start scheduler in async mode - DISABLED"""
        print("⚠️  Async scheduler is disabled")


# Global scheduler instance
daily_scheduler = DailySuccessScheduler()