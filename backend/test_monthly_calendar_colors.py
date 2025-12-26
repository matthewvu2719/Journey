#!/usr/bin/env python3
"""
Test monthly calendar colors with timezone fix
"""
import requests
from datetime import datetime, timedelta

def test_monthly_calendar_colors():
    """Test that future dates show gray, not red"""
    
    user_id = 'guest_1764871751353_lugns9dz6'
    timezone_offset = -300  # UTC-5

    # Get current month date range
    now = datetime.now()
    first_day = now.replace(day=1)
    if now.month == 12:
        last_day = now.replace(year=now.year + 1, month=1, day=1) - timedelta(days=1)
    else:
        last_day = now.replace(month=now.month + 1, day=1) - timedelta(days=1)

    start_date = first_day.strftime('%Y-%m-%d')
    end_date = last_day.strftime('%Y-%m-%d')

    print("🗓️ TESTING MONTHLY CALENDAR COLORS")
    print("=" * 50)
    print(f'Date range: {start_date} to {end_date}')
    print(f'Timezone offset: {timezone_offset} (UTC-5)')

    try:
        response = requests.get(f'http://localhost:8000/api/success-rates/range', params={
            'start_date': start_date,
            'end_date': end_date,
            'timezone_offset': timezone_offset
        }, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            rates = data['rates']
            
            # Calculate user's local today
            utc_now = datetime.utcnow()
            local_now = utc_now + timedelta(minutes=timezone_offset)
            user_today = local_now.date()
            
            print(f'\nUser local time: {local_now}')
            print(f'User today: {user_today}')
            
            # Check specific dates
            test_dates = [
                ('Yesterday', user_today - timedelta(days=1)),
                ('Today', user_today),
                ('Tomorrow', user_today + timedelta(days=1)),
                ('Day after tomorrow', user_today + timedelta(days=2))
            ]
            
            print(f'\n📅 DATE STATUS CHECK:')
            print("-" * 30)
            
            for label, test_date in test_dates:
                date_str = test_date.strftime('%Y-%m-%d')
                rate_data = next((r for r in rates if r['date'] == date_str), None)
                
                if rate_data:
                    status = rate_data['status']
                    expected = 'gray' if test_date > user_today else 'red'
                    
                    print(f'{label} ({date_str}): {status}')
                    
                    if status == expected:
                        print(f'  ✅ CORRECT: Expected {expected}, got {status}')
                    else:
                        print(f'  ❌ WRONG: Expected {expected}, got {status}')
                        if 'is_future_date' in rate_data:
                            print(f'  📝 Note: is_future_date = {rate_data["is_future_date"]}')
                else:
                    print(f'{label} ({date_str}): NOT FOUND')
                    
        else:
            print(f'❌ API Error: {response.status_code} - {response.text}')
            
    except Exception as e:
        print(f'❌ Connection error: {e}')

    print(f'\n{"=" * 50}')
    print("🎯 EXPECTED BEHAVIOR:")
    print("- Past dates with no data: RED")
    print("- Current date with no data: RED") 
    print("- Future dates: GRAY")
    print("- Dates with data: GREEN/YELLOW based on success rate")

if __name__ == "__main__":
    test_monthly_calendar_colors()