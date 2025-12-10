#!/usr/bin/env python3
"""
Detailed example showing how "Time Remaining" is calculated
"""

def demonstrate_time_remaining_calculation():
    """Show step-by-step time remaining calculation"""
    
    print("⏱️  Time Remaining Calculation Example")
    print("=" * 60)
    
    # Example habits with their estimated durations
    habits = [
        {
            'id': 1,
            'name': 'Drink Water',
            'days': ['Mon'],
            'times_of_day': ['morning', 'noon', 'afternoon', 'night'],
            'estimated_duration': 2  # 2 minutes per instance
        },
        {
            'id': 2,
            'name': 'Exercise',
            'days': ['Mon'],
            'times_of_day': ['morning'],
            'estimated_duration': 30  # 30 minutes
        },
        {
            'id': 3,
            'name': 'Read Book',
            'days': ['Mon'],
            'times_of_day': ['afternoon', 'night'],
            'estimated_duration': 20  # 20 minutes per instance
        },
        {
            'id': 4,
            'name': 'Take Vitamins',  # Atomic habit
            'days': ['Mon'],
            'times_of_day': ['morning'],
            'habit_type': 'atomic',
            'estimated_duration': None  # No duration for atomic habits
        },
        {
            'id': 5,
            'name': 'Deep Work Session',  # Big habit without duration set
            'days': ['Mon'],
            'times_of_day': ['afternoon'],
            'habit_type': 'big',
            'estimated_duration': None  # No duration specified
        }
    ]
    
    # Completions so far today
    completions = [
        {'habit_id': 1, 'time_of_day': 'morning'},   # Drink Water - Morning ✓
        {'habit_id': 1, 'time_of_day': 'noon'},      # Drink Water - Noon ✓
        {'habit_id': 2, 'time_of_day': 'morning'},   # Exercise - Morning ✓
        # Note: Other instances are NOT completed yet
    ]
    
    print("📋 Today's Habit Instances:")
    print()
    
    total_time_remaining = 0
    completed_instances = set()
    
    # Mark completed instances
    for completion in completions:
        key = f"{completion['habit_id']}_{completion['time_of_day']}"
        completed_instances.add(key)
    
    instance_count = 0
    
    for habit in habits:
        habit_type = habit.get('habit_type', 'big')
        duration = habit.get('estimated_duration') or 0
        print(f"🔹 {habit['name']} ({habit_type.capitalize()}, Duration: {duration} min per instance)")
        
        for time_of_day in habit['times_of_day']:
            instance_count += 1
            instance_key = f"{habit['id']}_{time_of_day}"
            
            is_completed = instance_key in completed_instances
            status = "✅ COMPLETED" if is_completed else "⏳ PENDING"
            
            print(f"   {instance_count}. {time_of_day.capitalize()}: {duration} min - {status}")
            
            # Add to time remaining if not completed AND it's a big habit with duration
            if not is_completed:
                if habit_type == 'big' and duration and duration > 0:
                    total_time_remaining += duration
                    print(f"      → Adding {duration} min to time remaining")
                else:
                    print(f"      → No time added (atomic habit or no duration set)")
        
        print()
    
    print("=" * 60)
    print("📊 CALCULATION SUMMARY:")
    print()
    print("Completed instances:")
    for completion in completions:
        habit_name = next(h['name'] for h in habits if h['id'] == completion['habit_id'])
        print(f"  ✅ {habit_name} - {completion['time_of_day']}")
    
    print()
    print("Remaining instances:")
    for habit in habits:
        for time_of_day in habit['times_of_day']:
            instance_key = f"{habit['id']}_{time_of_day}"
            if instance_key not in completed_instances:
                habit_type = habit.get('habit_type', 'big')
                duration = habit.get('estimated_duration') or 0
                if habit_type == 'big' and duration > 0:
                    print(f"  ⏳ {habit['name']} - {time_of_day}: {duration} min")
                else:
                    print(f"  ⏳ {habit['name']} - {time_of_day}: 0 min (atomic or no duration)")
    
    print()
    print(f"🎯 TOTAL TIME REMAINING: {total_time_remaining} minutes")
    print(f"   = {total_time_remaining // 60}h {total_time_remaining % 60}m")
    
    print()
    print("💡 CALCULATION LOGIC:")
    print("   1. For each habit scheduled today:")
    print("   2.   For each time_of_day of that habit:")
    print("   3.     If NOT completed:")
    print("   4.       If habit_type == 'big' AND estimated_duration > 0:")
    print("   5.         Add estimated_duration to total")
    print("   6.       Else: Add 0 (atomic habits or no duration set)")
    print("   7. Sum = Total time remaining for incomplete big habits")

if __name__ == "__main__":
    demonstrate_time_remaining_calculation()