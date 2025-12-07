"""
Achievement Engine - Tracks user achievements and unlocks rewards
"""
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from models import Completion, Habit, User
import random

class AchievementEngine:
    """Manages achievement tracking and reward unlocking"""
    
    # Achievement Types
    ACHIEVEMENT_TYPES = {
        'any_completion': {
            'name': 'Habit Completed',
            'description': 'Complete any habit',
            'reward_type': 'motivational_sentence',
            'check_frequency': 'immediate'
        },
        'daily_perfect': {
            'name': 'Perfect Day',
            'description': 'Complete 100% of today\'s habits',
            'reward_type': 'dance_emotion',
            'check_frequency': 'daily'
        },
        'weekly_perfect': {
            'name': 'Perfect Week',
            'description': 'Complete 100% of this week\'s habits',
            'reward_type': 'hat_costume',
            'check_frequency': 'weekly'
        },
        'monthly_perfect': {
            'name': 'Perfect Month',
            'description': 'Complete 100% of this month\'s habits',
            'reward_type': 'theme',
            'check_frequency': 'monthly'
        }
    }
    
    # Reward Libraries
    MOTIVATIONAL_SENTENCES = [
        "You're crushing it! Keep going! 💪",
        "One step closer to your goals! 🎯",
        "Consistency is your superpower! ⚡",
        "You're building something amazing! 🌟",
        "Small wins lead to big victories! 🏆",
        "You showed up today - that's what matters! 👏",
        "Progress over perfection! 📈",
        "You're stronger than you think! 💎",
        "Every habit completed is a win! 🎉",
        "You're making it happen! 🚀",
        "Believe in the process! 🌱",
        "You're unstoppable! 🔥",
        "Keep that momentum going! 🌊",
        "You're writing your success story! 📖",
        "Excellence is a habit, and you're building it! ✨"
    ]
    
    DANCES = [
        {'id': 'wiggle', 'name': 'Wiggle Dance', 'description': 'Side to side wiggle'},
        {'id': 'spin', 'name': 'Spin Move', 'description': 'Full body rotation'},
        {'id': 'wave', 'name': 'Wave Arms', 'description': 'Enthusiastic arm waving'},
        {'id': 'bounce', 'name': 'Happy Bounce', 'description': 'Bouncy celebration'},
        {'id': 'shimmy', 'name': 'Shimmy Shake', 'description': 'Quick shimmy motion'},
        {'id': 'victory', 'name': 'Victory Pose', 'description': 'Arms raised in triumph'},
        {'id': 'moonwalk', 'name': 'Moonwalk', 'description': 'Smooth backward slide'},
        {'id': 'robot', 'name': 'Robot Dance', 'description': 'Classic robot moves'}
    ]
    
    EMOTIONS = [
        {'id': 'super_happy', 'name': 'Super Happy', 'description': 'Extra wide smile'},
        {'id': 'wink', 'name': 'Wink', 'description': 'Playful wink'},
        {'id': 'star_eyes', 'name': 'Star Eyes', 'description': 'Eyes turn to stars'},
        {'id': 'heart_eyes', 'name': 'Heart Eyes', 'description': 'Eyes turn to hearts'}
    ]
    
    HATS = [
        {'id': 'party_hat', 'name': 'Party Hat', 'description': 'Colorful party cone'},
        {'id': 'crown', 'name': 'Crown', 'description': 'Royal golden crown'},
        {'id': 'cap', 'name': 'Baseball Cap', 'description': 'Sporty cap'},
        {'id': 'wizard_hat', 'name': 'Wizard Hat', 'description': 'Magical pointy hat'},
        {'id': 'top_hat', 'name': 'Top Hat', 'description': 'Classy top hat'},
        {'id': 'halo', 'name': 'Halo', 'description': 'Angelic halo'}
    ]
    
    COSTUMES = [
        {'id': 'cape', 'name': 'Superhero Cape', 'description': 'Red flowing cape'},
        {'id': 'bow_tie', 'name': 'Bow Tie', 'description': 'Fancy bow tie'},
        {'id': 'scarf', 'name': 'Scarf', 'description': 'Cozy winter scarf'},
        {'id': 'wings', 'name': 'Wings', 'description': 'Angel or fairy wings'}
    ]
    
    THEMES = [
        {'id': 'sunset', 'name': 'Sunset Glow', 'description': 'Warm orange and pink'},
        {'id': 'ocean', 'name': 'Ocean Breeze', 'description': 'Cool blues and teals'},
        {'id': 'forest', 'name': 'Forest Green', 'description': 'Natural greens'},
        {'id': 'galaxy', 'name': 'Galaxy', 'description': 'Deep purples and blues'},
        {'id': 'autumn', 'name': 'Autumn Leaves', 'description': 'Warm browns and oranges'},
        {'id': 'cherry_blossom', 'name': 'Cherry Blossom', 'description': 'Soft pinks'}
    ]
    
    def __init__(self, db: Session):
        self.db = db
    
    def check_achievements(self, user_id: str, completion_date: str = None) -> List[Dict]:
        """
        Check all achievements for a user and return newly unlocked rewards
        
        Args:
            user_id: User ID
            completion_date: Date to check (defaults to today)
        
        Returns:
            List of unlocked achievements with rewards
        """
        if not completion_date:
            completion_date = datetime.now().date().isoformat()
        
        unlocked = []
        
        # Check each achievement type
        if self._check_any_completion(user_id, completion_date):
            unlocked.append(self._unlock_motivational_sentence(user_id))
        
        if self._check_daily_perfect(user_id, completion_date):
            unlocked.append(self._unlock_dance_emotion(user_id))
        
        if self._check_weekly_perfect(user_id, completion_date):
            unlocked.append(self._unlock_hat_costume(user_id))
        
        if self._check_monthly_perfect(user_id, completion_date):
            unlocked.append(self._unlock_theme(user_id))
        
        return [u for u in unlocked if u]  # Filter out None values
    
    def _check_any_completion(self, user_id: str, date: str) -> bool:
        """Check if user completed any habit today"""
        completions = self.db.query(Completion).filter(
            Completion.user_id == user_id,
            Completion.completed_date == date
        ).count()
        return completions > 0
    
    def _check_daily_perfect(self, user_id: str, date: str) -> bool:
        """Check if user completed 100% of today's habits"""
        # Get today's day of week
        date_obj = datetime.fromisoformat(date)
        day_name = date_obj.strftime('%a')  # Mon, Tue, etc.
        
        # Get all habits scheduled for today
        habits = self.db.query(Habit).filter(
            Habit.user_id == user_id,
            Habit.days.contains([day_name])
        ).all()
        
        if not habits:
            return False
        
        # Count total required completions (habits * times_of_day)
        total_required = sum(len(h.times_of_day) if h.times_of_day else 1 for h in habits)
        
        # Count actual completions
        completed = self.db.query(Completion).filter(
            Completion.user_id == user_id,
            Completion.completed_date == date
        ).count()
        
        return completed >= total_required
    
    def _check_weekly_perfect(self, user_id: str, date: str) -> bool:
        """Check if user completed 100% of this week's habits"""
        date_obj = datetime.fromisoformat(date)
        # Get Monday of current week
        monday = date_obj - timedelta(days=date_obj.weekday())
        sunday = monday + timedelta(days=6)
        
        # Get all habits
        habits = self.db.query(Habit).filter(Habit.user_id == user_id).all()
        if not habits:
            return False
        
        # Calculate total required completions for the week
        total_required = 0
        for habit in habits:
            if habit.days:
                days_count = len(habit.days)
                times_count = len(habit.times_of_day) if habit.times_of_day else 1
                total_required += days_count * times_count
        
        # Count actual completions this week
        completed = self.db.query(Completion).filter(
            Completion.user_id == user_id,
            Completion.completed_date >= monday.date().isoformat(),
            Completion.completed_date <= sunday.date().isoformat()
        ).count()
        
        return completed >= total_required and total_required > 0
    
    def _check_monthly_perfect(self, user_id: str, date: str) -> bool:
        """Check if user completed 100% of this month's habits"""
        date_obj = datetime.fromisoformat(date)
        # Get first and last day of month
        first_day = date_obj.replace(day=1)
        if date_obj.month == 12:
            last_day = date_obj.replace(year=date_obj.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            last_day = date_obj.replace(month=date_obj.month + 1, day=1) - timedelta(days=1)
        
        # Get all habits
        habits = self.db.query(Habit).filter(Habit.user_id == user_id).all()
        if not habits:
            return False
        
        # Calculate total required completions for the month
        total_required = 0
        current_day = first_day
        while current_day <= last_day:
            day_name = current_day.strftime('%a')
            for habit in habits:
                if habit.days and day_name in habit.days:
                    times_count = len(habit.times_of_day) if habit.times_of_day else 1
                    total_required += times_count
            current_day += timedelta(days=1)
        
        # Count actual completions this month
        completed = self.db.query(Completion).filter(
            Completion.user_id == user_id,
            Completion.completed_date >= first_day.date().isoformat(),
            Completion.completed_date <= last_day.date().isoformat()
        ).count()
        
        return completed >= total_required and total_required > 0
    
    def _unlock_motivational_sentence(self, user_id: str) -> Optional[Dict]:
        """Unlock a random motivational sentence"""
        sentence = random.choice(self.MOTIVATIONAL_SENTENCES)
        return {
            'achievement_type': 'any_completion',
            'achievement_name': 'Habit Completed',
            'reward_type': 'motivational_sentence',
            'reward': sentence,
            'message': f'🎯 Achievement Unlocked! New motivational message: "{sentence}"'
        }
    
    def _unlock_dance_emotion(self, user_id: str) -> Optional[Dict]:
        """Unlock a random dance and emotion"""
        dance = random.choice(self.DANCES)
        emotion = random.choice(self.EMOTIONS)
        return {
            'achievement_type': 'daily_perfect',
            'achievement_name': 'Perfect Day',
            'reward_type': 'dance_emotion',
            'reward': {
                'dance': dance,
                'emotion': emotion
            },
            'message': f'⭐ Perfect Day! Bobo learned "{dance["name"]}" and "{emotion["name"]}"!'
        }
    
    def _unlock_hat_costume(self, user_id: str) -> Optional[Dict]:
        """Unlock a random hat and costume"""
        hat = random.choice(self.HATS)
        costume = random.choice(self.COSTUMES)
        return {
            'achievement_type': 'weekly_perfect',
            'achievement_name': 'Perfect Week',
            'reward_type': 'hat_costume',
            'reward': {
                'hat': hat,
                'costume': costume
            },
            'message': f'🏆 Perfect Week! Bobo got a {hat["name"]} and {costume["name"]}!'
        }
    
    def _unlock_theme(self, user_id: str) -> Optional[Dict]:
        """Unlock a random theme"""
        theme = random.choice(self.THEMES)
        return {
            'achievement_type': 'monthly_perfect',
            'achievement_name': 'Perfect Month',
            'reward_type': 'theme',
            'reward': theme,
            'message': f'👑 Perfect Month! New theme unlocked: {theme["name"]}!'
        }
    
    def get_user_progress(self, user_id: str) -> Dict:
        """Get user's current achievement progress"""
        today = datetime.now().date().isoformat()
        
        return {
            'daily_progress': self._get_daily_progress(user_id, today),
            'weekly_progress': self._get_weekly_progress(user_id, today),
            'monthly_progress': self._get_monthly_progress(user_id, today),
            'total_completions': self._get_total_completions(user_id)
        }
    
    def _get_daily_progress(self, user_id: str, date: str) -> Dict:
        """Get daily completion progress"""
        date_obj = datetime.fromisoformat(date)
        day_name = date_obj.strftime('%a')
        
        habits = self.db.query(Habit).filter(
            Habit.user_id == user_id,
            Habit.days.contains([day_name])
        ).all()
        
        total_required = sum(len(h.times_of_day) if h.times_of_day else 1 for h in habits)
        completed = self.db.query(Completion).filter(
            Completion.user_id == user_id,
            Completion.completed_date == date
        ).count()
        
        return {
            'completed': completed,
            'total': total_required,
            'percentage': (completed / total_required * 100) if total_required > 0 else 0
        }
    
    def _get_weekly_progress(self, user_id: str, date: str) -> Dict:
        """Get weekly completion progress"""
        date_obj = datetime.fromisoformat(date)
        monday = date_obj - timedelta(days=date_obj.weekday())
        sunday = monday + timedelta(days=6)
        
        habits = self.db.query(Habit).filter(Habit.user_id == user_id).all()
        total_required = sum(
            len(h.days) * (len(h.times_of_day) if h.times_of_day else 1)
            for h in habits if h.days
        )
        
        completed = self.db.query(Completion).filter(
            Completion.user_id == user_id,
            Completion.completed_date >= monday.date().isoformat(),
            Completion.completed_date <= sunday.date().isoformat()
        ).count()
        
        return {
            'completed': completed,
            'total': total_required,
            'percentage': (completed / total_required * 100) if total_required > 0 else 0
        }
    
    def _get_monthly_progress(self, user_id: str, date: str) -> Dict:
        """Get monthly completion progress"""
        date_obj = datetime.fromisoformat(date)
        first_day = date_obj.replace(day=1)
        if date_obj.month == 12:
            last_day = date_obj.replace(year=date_obj.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            last_day = date_obj.replace(month=date_obj.month + 1, day=1) - timedelta(days=1)
        
        habits = self.db.query(Habit).filter(Habit.user_id == user_id).all()
        
        # Calculate total required
        total_required = 0
        current_day = first_day
        while current_day <= last_day:
            day_name = current_day.strftime('%a')
            for habit in habits:
                if habit.days and day_name in habit.days:
                    times_count = len(habit.times_of_day) if habit.times_of_day else 1
                    total_required += times_count
            current_day += timedelta(days=1)
        
        completed = self.db.query(Completion).filter(
            Completion.user_id == user_id,
            Completion.completed_date >= first_day.date().isoformat(),
            Completion.completed_date <= last_day.date().isoformat()
        ).count()
        
        return {
            'completed': completed,
            'total': total_required,
            'percentage': (completed / total_required * 100) if total_required > 0 else 0
        }
    
    def _get_total_completions(self, user_id: str) -> int:
        """Get total all-time completions"""
        return self.db.query(Completion).filter(
            Completion.user_id == user_id
        ).count()
