#!/usr/bin/env python3
"""
Test comprehensive date range system with Bobo
"""
import requests
import json

def test_bobo_date_queries():
    """Test various date queries with the enhanced Bobo"""
    
    test_queries = [
        'What habits do I have tomorrow?',
        'What did I have yesterday?',
        'Show me this week',
        'What about next week?', 
        'How many habits do I have on Mondays?'
    ]

    user_id = 'guest_1764871751353_lugns9dz6'
    timezone_offset = -300  # UTC-5

    print("🤖 TESTING BOBO'S COMPREHENSIVE DATE RANGE SYSTEM")
    print("=" * 60)

    for query in test_queries:
        print(f'\n🔍 TESTING: "{query}"')
        print("-" * 40)
        
        data = {
            'message': query,
            'user_id': user_id,
            'timezone_offset': timezone_offset
        }
        
        try:
            response = requests.post('http://localhost:8000/api/chat', json=data, timeout=10)
            if response.status_code == 200:
                result = response.json()
                print(f'🤖 Bobo: {result["response"]}')
            else:
                print(f'❌ Error: {response.status_code} - {response.text}')
        except Exception as e:
            print(f'❌ Connection error: {e}')
            break

    print(f'\n{"=" * 60}')
    print("🎉 COMPREHENSIVE DATE TESTING COMPLETE!")

if __name__ == "__main__":
    test_bobo_date_queries()