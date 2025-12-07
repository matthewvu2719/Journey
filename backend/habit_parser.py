"""
NLP Habit Parser (Phase 4)
Parses natural language text into structured habit data
"""
import re
from typing import Dict, Optional, List, Tuple
from datetime import time


class HabitParser:
    """Parse natural language descriptions into habit parameters"""
    
    def __init__(self):
        # Duration patterns
        self.duration_patterns = [
            (r'(\d+)\s*hours?', 60),  # "2 hours" -> 120 minutes
            (r'(\d+)\s*hrs?', 60),     # "2 hrs" -> 120 minutes
            (r'(\d+)\s*minutes?', 1),  # "30 minutes" -> 30 minutes
            (r'(\d+)\s*mins?', 1),     # "30 mins" -> 30 minutes
            (r'(\d+)\s*h', 60),        # "2h" -> 120 minutes
            (r'(\d+)\s*m', 1),         # "30m" -> 30 minutes
        ]
        
        # Frequency patterns
        self.frequency_map = {
            'daily': 7, 'everyday': 7, 'every day': 7,
            'weekdays': 5, 'weekday': 5,
            'weekly': 1, 'once a week': 1,
            'twice a week': 2, '2x week': 2,
            'three times a week': 3, '3x week': 3,
            'four times a week': 4, '4x week': 4,
            'five times a week': 5, '5x week': 5,
        }
        
        # Time of day patterns
        self.time_of_day_map = {
            'morning': 'morning', 'mornings': 'morning', 'am': 'morning',
            'afternoon': 'afternoon', 'afternoons': 'afternoon', 'pm': 'afternoon',
            'evening': 'evening', 'evenings': 'evening', 'night': 'evening',
            'before work': 'morning', 'after work': 'evening',
            'before bed': 'evening', 'bedtime': 'evening',
        }
        
        # Day patterns
        self.day_map = {
            'monday': 0, 'mon': 0, 'mondays': 0,
            'tuesday': 1, 'tue': 1, 'tuesdays': 1,
            'wednesday': 2, 'wed': 2, 'wednesdays': 2,
            'thursday': 3, 'thu': 3, 'thursdays': 3,
            'friday': 4, 'fri': 4, 'fridays': 4,
            'saturday': 5, 'sat': 5, 'saturdays': 5,
            'sunday': 6, 'sun': 6, 'sundays': 6,
        }
        
        # Common habit categories
        self.category_keywords = {
            'fitness': ['run', 'jog', 'workout', 'exercise', 'gym', 'yoga', 'stretch', 'walk', 'bike', 'swim'],
            'health': ['meditate', 'sleep', 'water', 'vitamins', 'medicine', 'doctor'],
            'learning': ['study', 'read', 'learn', 'practice', 'course', 'lesson', 'homework'],
            'work': ['work', 'meeting', 'project', 'task', 'email', 'call'],
            'personal': ['journal', 'diary', 'reflect', 'plan', 'organize', 'clean'],
            'social': ['call', 'meet', 'friend', 'family', 'date'],
        }
    
    def parse(self, text: str) -> Dict:
        """
        Parse natural language text into habit parameters
        
        Args:
            text: Natural language description (e.g., "Run for 30 minutes every morning")
            
        Returns:
            Dict with habit parameters
        """
        text_lower = text.lower()
        
        # Extract components
        name = self._extract_name(text)
        duration = self._extract_duration(text_lower)
        frequency = self._extract_frequency(text_lower)
        time_of_day = self._extract_time_of_day(text_lower)
        specific_days = self._extract_specific_days(text_lower)
        category = self._guess_category(text_lower)
        
        # Determine habit type
        habit_type = 'big' if duration else 'atomic'
        
        # Build result
        result = {
            'name': name,
            'habit_type': habit_type,
            'category': category,
            'target_frequency': frequency,
            'preferred_time_of_day': time_of_day,
        }
        
        if duration:
            result['estimated_duration'] = duration
        
        if specific_days:
            result['specific_days'] = specific_days
        
        # Add confidence score
        result['confidence'] = self._calculate_confidence(result)
        
        return result
    
    def _extract_name(self, text: str) -> str:
        """Extract habit name from text"""
        # Remove common filler words
        text = re.sub(r'\b(for|every|each|daily|on|in the|at)\b', '', text, flags=re.IGNORECASE)
        
        # Remove duration mentions
        text = re.sub(r'\d+\s*(hours?|hrs?|minutes?|mins?|h|m)', '', text, flags=re.IGNORECASE)
        
        # Remove frequency mentions
        text = re.sub(r'\b(daily|everyday|weekdays?|weekly|times? a week)\b', '', text, flags=re.IGNORECASE)
        
        # Remove time of day mentions
        text = re.sub(r'\b(morning|afternoon|evening|night|am|pm)\b', '', text, flags=re.IGNORECASE)
        
        # Clean up
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Capitalize first letter
        if text:
            text = text[0].upper() + text[1:]
        
        return text or "New Habit"
    
    def _extract_duration(self, text: str) -> Optional[int]:
        """Extract duration in minutes"""
        for pattern, multiplier in self.duration_patterns:
            match = re.search(pattern, text)
            if match:
                value = int(match.group(1))
                return value * multiplier
        return None
    
    def _extract_frequency(self, text: str) -> int:
        """Extract target frequency (times per week)"""
        # Check for explicit frequency mentions
        for phrase, freq in self.frequency_map.items():
            if phrase in text:
                return freq
        
        # Check for "X times a week" pattern
        match = re.search(r'(\d+)\s*(?:times?|x)\s*(?:a|per)?\s*week', text)
        if match:
            return int(match.group(1))
        
        # Check for specific days (count them)
        days = self._extract_specific_days(text)
        if days:
            return len(days)
        
        # Default to daily if no frequency specified
        return 7
    
    def _extract_time_of_day(self, text: str) -> Optional[str]:
        """Extract preferred time of day"""
        for phrase, time_of_day in self.time_of_day_map.items():
            if phrase in text:
                return time_of_day
        return None
    
    def _extract_specific_days(self, text: str) -> Optional[List[int]]:
        """Extract specific days of week"""
        days = []
        
        for day_name, day_num in self.day_map.items():
            if day_name in text:
                if day_num not in days:
                    days.append(day_num)
        
        # Check for "Mon/Wed/Fri" pattern
        day_abbrev_pattern = r'\b(mon|tue|wed|thu|fri|sat|sun)\b'
        matches = re.findall(day_abbrev_pattern, text)
        for match in matches:
            day_num = self.day_map.get(match)
            if day_num is not None and day_num not in days:
                days.append(day_num)
        
        return sorted(days) if days else None
    
    def _guess_category(self, text: str) -> str:
        """Guess habit category based on keywords"""
        for category, keywords in self.category_keywords.items():
            for keyword in keywords:
                if keyword in text:
                    return category
        return 'other'
    
    def _calculate_confidence(self, result: Dict) -> float:
        """Calculate confidence score (0-1) for parsed result"""
        score = 0.0
        total = 0.0
        
        # Name extracted
        if result.get('name') and result['name'] != "New Habit":
            score += 1.0
        total += 1.0
        
        # Duration extracted (if big habit)
        if result.get('habit_type') == 'big':
            if result.get('estimated_duration'):
                score += 1.0
            total += 1.0
        
        # Frequency extracted
        if result.get('target_frequency'):
            score += 1.0
        total += 1.0
        
        # Time of day extracted
        if result.get('preferred_time_of_day'):
            score += 0.5
        total += 0.5
        
        # Category guessed
        if result.get('category') != 'other':
            score += 0.5
        total += 0.5
        
        return score / total if total > 0 else 0.0
    
    def validate(self, parsed_data: Dict) -> Tuple[bool, List[str]]:
        """
        Validate parsed data and return missing fields
        
        Returns:
            (is_valid, missing_fields)
        """
        missing = []
        
        if not parsed_data.get('name') or parsed_data['name'] == "New Habit":
            missing.append('name')
        
        if parsed_data.get('habit_type') == 'big' and not parsed_data.get('estimated_duration'):
            missing.append('duration')
        
        if not parsed_data.get('target_frequency'):
            missing.append('frequency')
        
        is_valid = len(missing) == 0
        return is_valid, missing


# Global instance
habit_parser = HabitParser()


# Example usage and tests
if __name__ == "__main__":
    test_cases = [
        "Run for 30 minutes every morning",
        "Study 2 hours on Mon/Wed/Fri",
        "Meditate daily",
        "Workout 45 mins 3 times a week",
        "Read before bed",
        "Drink water every day",
    ]
    
    for test in test_cases:
        result = habit_parser.parse(test)
        print(f"\nInput: {test}")
        print(f"Result: {result}")
        print(f"Confidence: {result['confidence']:.2f}")
