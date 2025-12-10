"""
Success Calculator - Determines if a habit completion was successful
Uses multiple criteria to calculate success rate for ML training
"""
from typing import Dict, Any, Optional


class SuccessCalculator:
    """
    Calculates whether a habit completion was successful
    based on multiple criteria
    """
    
    def __init__(self):
        self.mood_scores = {'poor': 1, 'okay': 2, 'good': 3, 'great': 4}
        self.energy_scores = {'low': 1, 'medium': 2, 'high': 3}
    
    def calculate_success(self, 
                         completion: Dict[str, Any], 
                         habit: Optional[Dict[str, Any]] = None) -> bool:
        """
        Determine if a completion was successful
        
        Simple rule: If it's in habit_completions table, it's successful!
        The user completed the habit, so we count it as success.
        
        For legacy habit_logs table, check is_successful field if it exists.
        
        Args:
            completion: Completion data
            habit: Habit data (optional, not used for basic success)
            
        Returns:
            True if successful (always True for completions)
        """
        # Check explicit success flag (for legacy habit_logs table)
        if 'is_successful' in completion:
            return completion['is_successful']
        
        # If it's in habit_completions, it's successful by definition
        return True
    
    def calculate_success_utility(self,
                                  completion: Dict[str, Any],
                                  habit: Optional[Dict[str, Any]] = None) -> float:
        """
        Calculate success utility - a weighted score that gives more value to
        high-quality completions.
        
        Base success = 1.0 (you did it!)
        Bonus utility for:
        - Mood improved or stayed good/great: +0.5
        - Energy improved or maintained: +0.3
        - Duration shorter than estimated: +0.2
        
        Returns:
            Float from 1.0 (basic success) to 2.0 (exceptional success)
        """
        utility = 1.0  # Base utility for completing
        
        # Mood bonus
        mood_before = completion.get('mood_before')
        mood_after = completion.get('mood_after')
        
        if mood_after:
            # Great mood after = full bonus
            if mood_after == 'great':
                utility += 0.5
            # Good mood after = partial bonus
            elif mood_after == 'good':
                utility += 0.3
            # Mood improved = bonus
            elif mood_before and mood_after:
                before_score = self.mood_scores.get(mood_before, 2)
                after_score = self.mood_scores.get(mood_after, 2)
                if after_score > before_score:
                    improvement = (after_score - before_score) / 3  # Normalize
                    utility += 0.5 * improvement
        
        # Energy bonus
        energy_before = completion.get('energy_level_before')
        energy_after = completion.get('energy_level_after')
        
        if energy_after:
            # High energy after = full bonus
            if energy_after == 'high':
                utility += 0.3
            # Energy maintained or improved = bonus
            elif energy_before and energy_after:
                before_score = self.energy_scores.get(energy_before, 2)
                after_score = self.energy_scores.get(energy_after, 2)
                if after_score >= before_score:
                    utility += 0.3
                elif after_score == before_score - 1:
                    utility += 0.15  # Partial bonus for small decrease
        
        # Duration bonus (efficiency)
        if habit:
            actual_duration = completion.get('actual_duration')
            estimated_duration = habit.get('estimated_duration')
            
            if actual_duration and estimated_duration:
                # Finished faster = bonus
                if actual_duration < estimated_duration:
                    efficiency = 1.0 - (actual_duration / estimated_duration)
                    utility += 0.2 * efficiency
                # Finished on time = small bonus
                elif actual_duration == estimated_duration:
                    utility += 0.1
        
        return min(2.0, utility)  # Cap at 2.0
    
    def _check_mood_success(self, completion: Dict[str, Any]) -> Optional[bool]:
        """
        Check if mood indicates success
        Success = mood improved OR mood_after is good/great
        """
        mood_before = completion.get('mood_before')
        mood_after = completion.get('mood_after')
        
        if not mood_after:
            return None
        
        # If mood_after is good or great, that's success
        if mood_after in ['good', 'great']:
            return True
        
        # If we have both, check if mood improved
        if mood_before and mood_after:
            before_score = self.mood_scores.get(mood_before, 2)
            after_score = self.mood_scores.get(mood_after, 2)
            return after_score >= before_score
        
        # If mood_after is poor/okay and no before data, consider it not successful
        return False
    
    def _check_energy_success(self, completion: Dict[str, Any]) -> Optional[bool]:
        """
        Check if energy indicates success
        Success = energy maintained or increased
        """
        energy_before = completion.get('energy_level_before')
        energy_after = completion.get('energy_level_after')
        
        if not energy_after:
            return None
        
        # If energy_after is high, that's success
        if energy_after == 'high':
            return True
        
        # If we have both, check if energy maintained or increased
        if energy_before and energy_after:
            before_score = self.energy_scores.get(energy_before, 2)
            after_score = self.energy_scores.get(energy_after, 2)
            return after_score >= before_score
        
        # If energy_after is low and no before data, consider it not successful
        return energy_after != 'low'
    
    def _check_duration_success(self, 
                                completion: Dict[str, Any], 
                                habit: Dict[str, Any]) -> Optional[bool]:
        """
        Check if duration indicates success
        Success = actual duration within 150% of estimated
        """
        actual_duration = completion.get('actual_duration')
        estimated_duration = habit.get('estimated_duration')
        
        if not actual_duration or not estimated_duration:
            return None
        
        # Success if within 150% of estimate (some buffer for realistic timing)
        max_acceptable = estimated_duration * 1.5
        return actual_duration <= max_acceptable
    
    def calculate_success_score(self, 
                                completion: Dict[str, Any], 
                                habit: Optional[Dict[str, Any]] = None) -> float:
        """
        Calculate a success QUALITY score from 0.0 to 1.0
        
        This measures HOW WELL the habit was completed, not IF it was completed.
        Uses mood, energy, and duration to assess quality.
        
        Returns:
            Float between 0.0 (poor quality) and 1.0 (excellent quality)
        """
        scores = []
        
        # Mood score (0-1)
        mood_before = completion.get('mood_before')
        mood_after = completion.get('mood_after')
        if mood_after:
            mood_score = (self.mood_scores.get(mood_after, 2) - 1) / 3  # Normalize to 0-1
            if mood_before:
                # Bonus for improvement
                before_score = (self.mood_scores.get(mood_before, 2) - 1) / 3
                improvement = mood_score - before_score
                mood_score = min(1.0, mood_score + improvement * 0.2)
            scores.append(mood_score)
        
        # Energy score (0-1)
        energy_before = completion.get('energy_level_before')
        energy_after = completion.get('energy_level_after')
        if energy_after:
            energy_score = (self.energy_scores.get(energy_after, 2) - 1) / 2  # Normalize to 0-1
            if energy_before:
                # Bonus for maintenance/improvement
                before_score = (self.energy_scores.get(energy_before, 2) - 1) / 2
                if energy_score >= before_score:
                    energy_score = min(1.0, energy_score + 0.1)
            scores.append(energy_score)
        
        # Duration score (0-1)
        if habit:
            actual_duration = completion.get('actual_duration')
            estimated_duration = habit.get('estimated_duration')
            if actual_duration and estimated_duration:
                ratio = actual_duration / estimated_duration
                if ratio <= 1.0:
                    duration_score = 1.0  # Perfect or better
                elif ratio <= 1.5:
                    duration_score = 1.0 - (ratio - 1.0)  # Linear decay
                else:
                    duration_score = 0.0  # Too long
                scores.append(duration_score)
        
        # Average all available scores
        if scores:
            return sum(scores) / len(scores)
        
        # Default to 1.0 if no quality data (completion itself is success)
        return 1.0
    
    def get_success_explanation(self, 
                               completion: Dict[str, Any], 
                               habit: Optional[Dict[str, Any]] = None) -> str:
        """
        Get human-readable explanation of completion quality
        """
        quality_indicators = []
        
        # Check mood
        mood_after = completion.get('mood_after')
        if mood_after in ['good', 'great']:
            quality_indicators.append(f"Felt {mood_after}")
        elif mood_after:
            mood_before = completion.get('mood_before')
            if mood_before:
                if self.mood_scores.get(mood_after, 0) > self.mood_scores.get(mood_before, 0):
                    quality_indicators.append("Mood improved")
        
        # Check energy
        energy_after = completion.get('energy_level_after')
        energy_before = completion.get('energy_level_before')
        if energy_after and energy_before:
            if self.energy_scores.get(energy_after, 0) >= self.energy_scores.get(energy_before, 0):
                quality_indicators.append("Energy maintained")
        
        # Check duration
        if habit:
            actual = completion.get('actual_duration')
            estimated = habit.get('estimated_duration')
            if actual and estimated:
                if actual <= estimated:
                    quality_indicators.append("Completed on time")
                elif actual <= estimated * 1.5:
                    quality_indicators.append("Completed efficiently")
        
        if quality_indicators:
            return "Completed: " + ", ".join(quality_indicators)
        else:
            return "Completed successfully"
    
    def get_utility_explanation(self,
                               completion: Dict[str, Any],
                               habit: Optional[Dict[str, Any]] = None) -> str:
        """
        Get explanation of utility score with breakdown
        """
        utility = self.calculate_success_utility(completion, habit)
        base = 1.0
        bonus = utility - base
        
        if bonus < 0.1:
            return f"Success (utility: {utility:.2f}) - Basic completion"
        
        bonuses = []
        
        # Mood bonus
        mood_after = completion.get('mood_after')
        if mood_after in ['great', 'good']:
            bonuses.append(f"great mood (+{0.5 if mood_after == 'great' else 0.3:.1f})")
        
        # Energy bonus
        energy_after = completion.get('energy_level_after')
        if energy_after == 'high':
            bonuses.append("high energy (+0.3)")
        
        # Duration bonus
        if habit:
            actual = completion.get('actual_duration')
            estimated = habit.get('estimated_duration')
            if actual and estimated and actual < estimated:
                bonuses.append(f"efficient ({actual}/{estimated}min, +0.2)")
        
        if bonuses:
            return f"Excellent success (utility: {utility:.2f}) - {', '.join(bonuses)}"
        else:
            return f"Good success (utility: {utility:.2f})"


# Singleton instance
success_calculator = SuccessCalculator()
