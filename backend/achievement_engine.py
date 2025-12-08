"""
Achievement Engine - Tracks user achievements and unlocks rewards
"""
from datetime import datetime, timedelta
from typing import List, Dict, Optional
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
            'reward_type': 'dance',
            'check_frequency': 'daily'
        },
        'weekly_perfect': {
            'name': 'Perfect Week',
            'description': 'Complete 100% of this week\'s habits',
            'reward_type': 'hat_costume_color',
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
    
    COLORS = [
        {'id': 'cream', 'name': 'Cream', 'description': 'Classic cream color', 'hex': '#F9F5F2'},
        {'id': 'sky_blue', 'name': 'Sky Blue', 'description': 'Light sky blue', 'hex': '#87CEEB'},
        {'id': 'mint', 'name': 'Mint Green', 'description': 'Fresh mint green', 'hex': '#98D8C8'},
        {'id': 'lavender', 'name': 'Lavender', 'description': 'Soft lavender purple', 'hex': '#B19CD9'},
        {'id': 'peach', 'name': 'Peach', 'description': 'Warm peach', 'hex': '#FFB6A3'},
        {'id': 'coral', 'name': 'Coral Pink', 'description': 'Vibrant coral', 'hex': '#FF6B9D'},
        {'id': 'sunshine', 'name': 'Sunshine Yellow', 'description': 'Bright yellow', 'hex': '#FFD93D'},
        {'id': 'rose_gold', 'name': 'Rose Gold', 'description': 'Elegant rose gold', 'hex': '#E0A899'}
    ]
    
    THEMES = [
        {'id': 'sunset', 'name': 'Sunset Glow', 'description': 'Warm orange and pink'},
        {'id': 'ocean', 'name': 'Ocean Breeze', 'description': 'Cool blues and teals'},
        {'id': 'forest', 'name': 'Forest Green', 'description': 'Natural greens'},
        {'id': 'galaxy', 'name': 'Galaxy', 'description': 'Deep purples and blues'},
        {'id': 'autumn', 'name': 'Autumn Leaves', 'description': 'Warm browns and oranges'},
        {'id': 'cherry_blossom', 'name': 'Cherry Blossom', 'description': 'Soft pinks'}
    ]
    
    def __init__(self, db):
        self.db = db  # SupabaseClient instance
    
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
            unlocked.append(self._unlock_dance(user_id))
        
        if self._check_weekly_perfect(user_id, completion_date):
            unlocked.append(self._unlock_hat_costume(user_id))
        
        if self._check_monthly_perfect(user_id, completion_date):
            unlocked.append(self._unlock_theme(user_id))
        
        return [u for u in unlocked if u]  # Filter out None values
    
    def _check_any_completion(self, user_id: str, date: str) -> bool:
        """Check if user completed any habit today"""
        try:
            completions = self.db.get_completions(user_id, start_date=date, end_date=date)
            return len(completions) > 0
        except:
            return False
    
    def _check_daily_perfect(self, user_id: str, date: str) -> bool:
        """Check if user completed 100% of today's habits"""
        try:
            # Get today's day of week
            date_obj = datetime.fromisoformat(date)
            day_name = date_obj.strftime('%a')  # Mon, Tue, etc.
            
            # Get all habits scheduled for today
            habits = self.db.get_habits(user_id)
            today_habits = [h for h in habits if h.get('days') and day_name in h.get('days', [])]
            
            if not today_habits:
                return False
            
            # Count total required completions (habits * times_of_day)
            total_required = sum(len(h.get('times_of_day', [])) if h.get('times_of_day') else 1 for h in today_habits)
            
            # Count actual completions
            completions = self.db.get_completions(user_id, start_date=date, end_date=date)
            completed = len(completions)
            
            return completed >= total_required and total_required > 0
        except:
            return False
    
    def _check_weekly_perfect(self, user_id: str, date: str) -> bool:
        """Check if user completed 100% of this week's habits"""
        try:
            date_obj = datetime.fromisoformat(date)
            # Get Monday of current week
            monday = date_obj - timedelta(days=date_obj.weekday())
            sunday = monday + timedelta(days=6)
            
            # Get all habits
            habits = self.db.get_habits(user_id)
            if not habits:
                return False
            
            # Calculate total required completions for the week
            total_required = 0
            for habit in habits:
                if habit.get('days'):
                    days_count = len(habit.get('days', []))
                    times_count = len(habit.get('times_of_day', [])) if habit.get('times_of_day') else 1
                    total_required += days_count * times_count
            
            # Count actual completions this week
            completions = self.db.get_completions(
                user_id, 
                start_date=monday.date().isoformat(),
                end_date=sunday.date().isoformat()
            )
            completed = len(completions)
            
            return completed >= total_required and total_required > 0
        except:
            return False
    
    def _check_monthly_perfect(self, user_id: str, date: str) -> bool:
        """Check if user completed 100% of this month's habits"""
        try:
            date_obj = datetime.fromisoformat(date)
            # Get first and last day of month
            first_day = date_obj.replace(day=1)
            if date_obj.month == 12:
                last_day = date_obj.replace(year=date_obj.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                last_day = date_obj.replace(month=date_obj.month + 1, day=1) - timedelta(days=1)
            
            # Get all habits
            habits = self.db.get_habits(user_id)
            if not habits:
                return False
            
            # Calculate total required completions for the month
            total_required = 0
            current_day = first_day
            while current_day <= last_day:
                day_name = current_day.strftime('%a')
                for habit in habits:
                    if habit.get('days') and day_name in habit.get('days', []):
                        times_count = len(habit.get('times_of_day', [])) if habit.get('times_of_day') else 1
                        total_required += times_count
                current_day += timedelta(days=1)
            
            # Count actual completions this month
            completions = self.db.get_completions(
                user_id,
                start_date=first_day.date().isoformat(),
                end_date=last_day.date().isoformat()
            )
            completed = len(completions)
            
            return completed >= total_required and total_required > 0
        except:
            return False
    
    def _unlock_motivational_sentence(self, user_id: str) -> Optional[Dict]:
        """Unlock a random motivational sentence"""
        sentence = random.choice(self.MOTIVATIONAL_SENTENCES)
        reward_data = {
            'achievement_type': 'any_completion',
            'achievement_name': 'Habit Completed',
            'reward_type': 'motivational_sentence',
            'reward': sentence,
            'message': f'🎯 Achievement Unlocked! New motivational message: "{sentence}"'
        }
        
        # Save to database
        self._save_reward(user_id, reward_data)
        return reward_data
    
    def _unlock_dance(self, user_id: str) -> Optional[Dict]:
        """Unlock an AI-generated dance"""
        from bobo_customization_agent import customization_agent
        
        # Generate COMPLETELY NEW dance using AI!
        dance = customization_agent.generate_dance()
        
        # Save individual item to bobo_items table
        self._save_bobo_item(user_id, 'dance', dance, 'daily_perfect')
        
        reward_data = {
            'achievement_type': 'daily_perfect',
            'achievement_name': 'Perfect Day',
            'reward_type': 'dance',
            'reward': dance,
            'message': f'⭐ Perfect Day! Bobo learned "{dance["name"]}"!'
        }
        
        # Also save to unlocked_rewards for history
        self._save_reward(user_id, reward_data)
        return reward_data
    
    def _unlock_hat_costume(self, user_id: str) -> Optional[Dict]:
        """Unlock an AI-generated hat and costume"""
        from bobo_customization_agent import customization_agent
        
        # Generate COMPLETELY NEW hat and costume using AI!
        hat = customization_agent.generate_hat()
        costume = customization_agent.generate_costume()
        
        # Save individual items to bobo_items table
        self._save_bobo_item(user_id, 'hat', hat, 'weekly_perfect')
        self._save_bobo_item(user_id, 'costume', costume, 'weekly_perfect')
        
        reward_data = {
            'achievement_type': 'weekly_perfect',
            'achievement_name': 'Perfect Week',
            'reward_type': 'hat_costume',
            'reward': {
                'hat': hat,
                'costume': costume
            },
            'message': f'🏆 Perfect Week! Bobo got a {hat["name"]} and {costume["name"]}!'
        }
        
        # Also save to unlocked_rewards for history
        self._save_reward(user_id, reward_data)
        return reward_data
    
    def _unlock_theme(self, user_id: str) -> Optional[Dict]:
        """Unlock a random color"""
        import random
        
        # Pick a random color
        color = random.choice(self.COLORS)
        
        # Save color to bobo_items table
        self._save_bobo_item(user_id, 'color', color, 'monthly_perfect')
        
        reward_data = {
            'achievement_type': 'monthly_perfect',
            'achievement_name': 'Perfect Month',
            'reward_type': 'color',
            'reward': color,
            'message': f'👑 Perfect Month! New color unlocked: {color["name"]}!'
        }
        
        # Save to database
        self._save_reward(user_id, reward_data)
        return reward_data
    
    def _save_reward(self, user_id: str, reward_data: Dict):
        """Save unlocked reward to database (for history)"""
        try:
            self.db.save_unlocked_reward({
                'user_id': user_id,
                'reward_type': reward_data['reward_type'],
                'reward_data': reward_data['reward'],
                'achievement_type': reward_data['achievement_type']
            })
        except Exception as e:
            print(f"Error saving reward: {e}")
    
    def _save_bobo_item(self, user_id: str, item_type: str, item_data: Dict, achievement_type: str):
        """Save individual Bobo item to bobo_items table"""
        try:
            # For colors, store hex value in svg_data field
            svg_data = item_data.get('hex', '') if item_type == 'color' else item_data.get('svg', '')
            
            self.db.save_bobo_item({
                'user_id': user_id,
                'item_type': item_type,
                'item_id': item_data['id'],
                'item_name': item_data['name'],
                'item_description': item_data.get('description', ''),
                'svg_data': svg_data,
                'animation_data': {
                    'keyframes': item_data.get('keyframes', {}),
                    'duration': item_data.get('duration', 800),
                    'timing': item_data.get('timing', 'ease-in-out'),
                    'movements': item_data.get('movements', {
                        'arms': {'speed': 50, 'amplitude': 20, 'pattern': 'wave'},
                        'head': {'speed': 100, 'amplitude': 5, 'pattern': 'nod'},
                        'hands': {'speed': 80, 'amplitude': 15, 'pattern': 'wiggle'}
                    })
                } if item_type == 'dance' else item_data.get('keyframes', {}),
                'achievement_type': achievement_type
            })
        except Exception as e:
            print(f"Error saving bobo item: {e}")
    
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
        try:
            date_obj = datetime.fromisoformat(date)
            day_name = date_obj.strftime('%a')
            
            habits = self.db.get_habits(user_id)
            today_habits = [h for h in habits if h.get('days') and day_name in h.get('days', [])]
            
            total_required = sum(len(h.get('times_of_day', [])) if h.get('times_of_day') else 1 for h in today_habits)
            completions = self.db.get_completions(user_id, start_date=date, end_date=date)
            completed = len(completions)
            
            return {
                'completed': completed,
                'total': total_required,
                'percentage': (completed / total_required * 100) if total_required > 0 else 0
            }
        except:
            return {'completed': 0, 'total': 0, 'percentage': 0}
    
    def _get_weekly_progress(self, user_id: str, date: str) -> Dict:
        """Get weekly completion progress"""
        try:
            date_obj = datetime.fromisoformat(date)
            monday = date_obj - timedelta(days=date_obj.weekday())
            sunday = monday + timedelta(days=6)
            
            habits = self.db.get_habits(user_id)
            total_required = sum(
                len(h.get('days', [])) * (len(h.get('times_of_day', [])) if h.get('times_of_day') else 1)
                for h in habits if h.get('days')
            )
            
            completions = self.db.get_completions(
                user_id,
                start_date=monday.date().isoformat(),
                end_date=sunday.date().isoformat()
            )
            completed = len(completions)
            
            return {
                'completed': completed,
                'total': total_required,
                'percentage': (completed / total_required * 100) if total_required > 0 else 0
            }
        except:
            return {'completed': 0, 'total': 0, 'percentage': 0}
    
    def _get_monthly_progress(self, user_id: str, date: str) -> Dict:
        """Get monthly completion progress"""
        try:
            date_obj = datetime.fromisoformat(date)
            first_day = date_obj.replace(day=1)
            if date_obj.month == 12:
                last_day = date_obj.replace(year=date_obj.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                last_day = date_obj.replace(month=date_obj.month + 1, day=1) - timedelta(days=1)
            
            habits = self.db.get_habits(user_id)
            
            # Calculate total required
            total_required = 0
            current_day = first_day
            while current_day <= last_day:
                day_name = current_day.strftime('%a')
                for habit in habits:
                    if habit.get('days') and day_name in habit.get('days', []):
                        times_count = len(habit.get('times_of_day', [])) if habit.get('times_of_day') else 1
                        total_required += times_count
                current_day += timedelta(days=1)
            
            completions = self.db.get_completions(
                user_id,
                start_date=first_day.date().isoformat(),
                end_date=last_day.date().isoformat()
            )
            completed = len(completions)
            
            return {
                'completed': completed,
                'total': total_required,
                'percentage': (completed / total_required * 100) if total_required > 0 else 0
            }
        except:
            return {'completed': 0, 'total': 0, 'percentage': 0}
    
    def _get_total_completions(self, user_id: str) -> int:
        """Get total all-time completions"""
        try:
            completions = self.db.get_completions(user_id)
            return len(completions)
        except:
            return 0
