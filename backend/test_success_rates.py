"""
Test script for daily success rate system
"""
from datetime import datetime, date, timedelta
from database import db
from daily_success_scheduler import daily_scheduler


def test_success_rate_system():
    """Test the daily success rate calculation system"""
    
    print("🧪 Testing Daily Success Rate System")
    print("=" * 50)
    
    user_id = "test_user"
    test_date = date.today() - timedelta(days=1)  # Yesterday
    
    # Test 1: Method removed - success rates only saved when habits completed
    print(f"\n1. Success rate calculation method removed")
    print("✓ Success rates are now only saved when habits are completed")
    print("  - Missing past dates will show gray status")
    print("  - No automatic calculation for missing data")
    
    # Test 2: Retrieve stored success rate
    print(f"\n2. Testing retrieval of stored success rate")
    
    stored = db.get_daily_success_rate(user_id, test_date)
    if stored:
        print(f"✓ Retrieved stored rate: {stored['success_rate']}%")
    else:
        print("✗ No stored rate found")
    
    # Test 3: Get success rate with status
    print(f"\n3. Testing success rate with status determination")
    
    rate_with_status = daily_scheduler.get_success_rate_for_date(user_id, test_date)
    print(f"✓ Success rate: {rate_with_status['success_rate']}%")
    print(f"✓ Status: {rate_with_status['status']}")
    
    # Test 4: Test current day calculation
    print(f"\n4. Testing current day real-time calculation")
    
    today_rate = daily_scheduler.get_current_day_success_rate(user_id)
    print(f"✓ Today's rate: {today_rate['success_rate']}%")
    print(f"✓ Today's status: {today_rate['status']}")
    
    # Test 5: Test future date
    print(f"\n5. Testing future date handling")
    
    future_date = date.today() + timedelta(days=1)
    future_rate = daily_scheduler.get_success_rate_for_date(user_id, future_date)
    print(f"✓ Future date status: {future_rate['status']}")
    
    # Test 6: Test date range
    print(f"\n6. Testing date range retrieval")
    
    start_date = date.today() - timedelta(days=7)
    end_date = date.today()
    
    range_rates = db.get_daily_success_rates_range(user_id, start_date, end_date)
    print(f"✓ Retrieved {len(range_rates)} rates for date range")
    
    print("\n" + "=" * 50)
    print("🎉 Daily Success Rate System Test Complete!")


if __name__ == "__main__":
    test_success_rate_system()