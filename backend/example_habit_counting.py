#!/usr/bin/env python3
"""
Example demonstrating the corrected habit counting logic
"""

def demonstrate_habit_counting():
    """Show how habit instances are counted correctly"""
    
    print("🧮 Habit Instance Counting Examples")
    print("=" * 50)
    
    # Example habits
    habits = [
        {
            'id': 1,
            'name': 'Drink Water',
            'days': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            'times_of_day': ['morning', 'noon', 'afternoon', 'night'],  # 4 times
            'estimated_duration': 2
        },
        {
            'id': 2,
            'name': 'Exercise',
            'days': ['Mon', 'Wed', 'Fri'],
            'times_of_day': ['morning'],  # 1 time
            'estimated_duration': 30
        },
        {
            'id': 3,
            'name': 'Read',
            'days': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            'times_of_day': ['afternoon', 'night'],  # 2 times
            'estimated_duration': 20
        }
    ]
    
    # Assume today is Monday
    today = 'Mon'
    
    print(f"\n📅 Today: {today}")
    print("\n📋 Habits:")
    
    total_instances = 0
    
    for habit in habits:
        habit_days = habit.get('days', [])
        habit_times = habit.get('times_of_day', [])
        
        # Check if habit is scheduled for today
        if not habit_days or today in habit_days:
            # If no times specified, default to one instance
            if not habit_times:
                habit_times = ['default']
            
            instances_count = len(habit_times)
            total_instances += instances_count
            
            print(f"  • {habit['name']}")
            print(f"    Days: {habit_days}")
            print(f"    Times: {habit_times}")
            print(f"    Instances today: {instances_count}")
            print(f"    Duration per instance: {habit['estimated_duration']} min")
            print()
    
    print(f"🎯 Total habit instances today: {total_instances}")
    print(f"⏱️  Total estimated time: {sum(h['estimated_duration'] * len(h.get('times_of_day', ['default'])) for h in habits if not h.get('days') or today in h.get('days', []))} minutes")
    
    print("\n" + "=" * 50)
    print("✅ CORRECT: Each habit × time_of_day = 1 instance")
    print("❌ WRONG: Each unique habit = 1 count (ignores multiple times)")

if __name__ == "__main__":
    demonstrate_habit_counting()