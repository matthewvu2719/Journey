"""
Call Scheduler Service
Manages scheduled calls for both WebRTC and Twilio
"""
import os
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import asyncio

class CallScheduler:
    """Manages scheduled voice calls"""
    
    def __init__(self, db_client, notification_service=None):
        self.db = db_client
        self.notification_service = notification_service
        self.scheduler = AsyncIOScheduler()
        self.scheduler.start()
        print("✓ Call Scheduler initialized")
    
    def schedule_call(
        self,
        user_id: str,
        call_method: str,  # 'webrtc' or 'twilio'
        scheduled_time: datetime,
        call_purpose: str = "check_in",
        phone_number: Optional[str] = None
    ) -> Dict:
        """
        Schedule a call for a specific time
        
        Args:
            user_id: User ID
            call_method: 'webrtc' or 'twilio'
            scheduled_time: When to make the call
            call_purpose: Purpose of call
            phone_number: Required for Twilio calls
        
        Returns:
            Scheduled call data
        """
        # Validate
        if call_method == 'twilio' and not phone_number:
            raise ValueError("Phone number required for Twilio calls")
        
        # Save to database
        call_data = {
            "user_id": user_id,
            "call_method": call_method,
            "scheduled_time": scheduled_time.isoformat(),
            "call_purpose": call_purpose,
            "phone_number": phone_number,
            "status": "pending"
        }
        
        scheduled_call = self.db.create_scheduled_call(call_data)
        
        # Add to scheduler
        job_id = f"call_{scheduled_call['id']}"
        self.scheduler.add_job(
            self._execute_call,
            trigger='date',
            run_date=scheduled_time,
            args=[scheduled_call['id']],
            id=job_id
        )
        
        print(f"📅 Scheduled {call_method} call for {user_id} at {scheduled_time}")
        return scheduled_call
    
    def schedule_recurring_call(
        self,
        user_id: str,
        call_method: str,
        days_of_week: List[str],  # ['mon', 'tue', 'wed', ...]
        time_of_day: str,  # '09:00'
        call_purpose: str = "check_in",
        phone_number: Optional[str] = None
    ) -> List[Dict]:
        """
        Schedule recurring calls
        
        Args:
            user_id: User ID
            call_method: 'webrtc' or 'twilio'
            days_of_week: List of days (mon, tue, wed, thu, fri, sat, sun)
            time_of_day: Time in HH:MM format
            call_purpose: Purpose of call
            phone_number: Required for Twilio
        
        Returns:
            List of scheduled calls
        """
        # Parse time
        hour, minute = map(int, time_of_day.split(':'))
        
        # Create cron trigger
        cron_trigger = CronTrigger(
            day_of_week=','.join(days_of_week),
            hour=hour,
            minute=minute
        )
        
        # Add to scheduler
        job_id = f"recurring_call_{user_id}_{call_method}"
        self.scheduler.add_job(
            self._execute_recurring_call,
            trigger=cron_trigger,
            args=[user_id, call_method, call_purpose, phone_number],
            id=job_id,
            replace_existing=True
        )
        
        print(f"📅 Scheduled recurring {call_method} calls for {user_id}")
        
        # Return next scheduled times
        return self._get_next_occurrences(user_id, days_of_week, time_of_day)
    
    async def _execute_call(self, scheduled_call_id: int):
        """Execute a scheduled call"""
        # Get call details
        call = self.db.get_scheduled_call(scheduled_call_id)
        if not call or call['status'] != 'pending':
            return
        
        # Update status
        self.db.update_scheduled_call(scheduled_call_id, {"status": "in_progress"})
        
        try:
            if call['call_method'] == 'webrtc':
                await self._execute_webrtc_call(call)
            elif call['call_method'] == 'twilio':
                await self._execute_twilio_call(call)
        except Exception as e:
            print(f"❌ Error executing call {scheduled_call_id}: {e}")
            self.db.update_scheduled_call(scheduled_call_id, {"status": "failed"})
    
    async def _execute_webrtc_call(self, call: Dict):
        """Execute WebRTC call (send notification)"""
        # Send push notification
        if self.notification_service:
            await self.notification_service.send_notification(
                user_id=call['user_id'],
                title="🤖 Bobo wants to talk!",
                body=f"Tap to start your {call['call_purpose']} call",
                data={
                    "type": "voice_call",
                    "call_method": "webrtc",
                    "scheduled_call_id": call['id']
                }
            )
        
        # Update status
        self.db.update_scheduled_call(call['id'], {
            "status": "notification_sent",
            "notification_sent": True
        })
        
        print(f"📲 Sent WebRTC call notification to user {call['user_id']}")
    
    async def _execute_twilio_call(self, call: Dict):
        """Execute Twilio phone call"""
        from .twilio_service import get_twilio_service
        
        twilio = get_twilio_service()
        
        # Make the call
        call_sid = twilio.make_call(
            to_number=call['phone_number'],
            user_id=call['user_id'],
            call_purpose=call['call_purpose']
        )
        
        if call_sid:
            # Update with call SID
            self.db.update_scheduled_call(call['id'], {
                "status": "in_progress",
                "call_sid": call_sid
            })
            print(f"📞 Initiated Twilio call {call_sid}")
        else:
            self.db.update_scheduled_call(call['id'], {"status": "failed"})
    
    async def _execute_recurring_call(
        self,
        user_id: str,
        call_method: str,
        call_purpose: str,
        phone_number: Optional[str]
    ):
        """Execute a recurring call"""
        # Create scheduled call entry
        now = datetime.now()
        call_data = {
            "user_id": user_id,
            "call_method": call_method,
            "scheduled_time": now.isoformat(),
            "call_purpose": call_purpose,
            "phone_number": phone_number,
            "status": "pending"
        }
        
        scheduled_call = self.db.create_scheduled_call(call_data)
        
        # Execute immediately
        await self._execute_call(scheduled_call['id'])
    
    def cancel_call(self, scheduled_call_id: int) -> bool:
        """Cancel a scheduled call"""
        # Remove from scheduler
        job_id = f"call_{scheduled_call_id}"
        try:
            self.scheduler.remove_job(job_id)
        except:
            pass
        
        # Update database
        self.db.update_scheduled_call(scheduled_call_id, {"status": "cancelled"})
        print(f"❌ Cancelled call {scheduled_call_id}")
        return True
    
    def cancel_recurring_call(self, user_id: str, call_method: str) -> bool:
        """Cancel recurring calls"""
        job_id = f"recurring_call_{user_id}_{call_method}"
        try:
            self.scheduler.remove_job(job_id)
            print(f"❌ Cancelled recurring calls for {user_id}")
            return True
        except:
            return False
    
    def get_scheduled_calls(self, user_id: str) -> List[Dict]:
        """Get all scheduled calls for a user"""
        return self.db.get_scheduled_calls(user_id)
    
    def _get_next_occurrences(
        self,
        user_id: str,
        days_of_week: List[str],
        time_of_day: str,
        count: int = 7
    ) -> List[Dict]:
        """Get next N occurrences of recurring call"""
        # This is a simplified version
        # In production, calculate actual next occurrences
        return [{
            "user_id": user_id,
            "days": days_of_week,
            "time": time_of_day,
            "type": "recurring"
        }]
    
    def shutdown(self):
        """Shutdown scheduler"""
        self.scheduler.shutdown()
        print("📅 Call Scheduler shutdown")


# Singleton instance
_call_scheduler: Optional[CallScheduler] = None

def get_call_scheduler(db_client=None, notification_service=None) -> CallScheduler:
    """Get or create Call Scheduler singleton"""
    global _call_scheduler
    if _call_scheduler is None and db_client:
        _call_scheduler = CallScheduler(db_client, notification_service)
    return _call_scheduler
