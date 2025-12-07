#!/bin/bash
# Test completion flow with curl

echo "🧪 Testing Habit Completion Flow"
echo ""

# Step 1: Guest login
echo "1️⃣ Getting guest token..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/guest \
  -H "Content-Type: application/json" \
  -d '{"device_id": "test_device"}')

TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Got token"
echo ""

# Step 2: Get habits
echo "2️⃣ Fetching habits..."
HABITS=$(curl -s http://localhost:8000/api/habits \
  -H "Authorization: Bearer $TOKEN")

echo "Habits: $HABITS"
echo ""

# Step 3: Create completion (using habit ID 1 as example)
echo "3️⃣ Creating completion for habit ID 1..."
COMPLETION=$(curl -s -X POST http://localhost:8000/api/completions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "habit_id": 1,
    "mood_before": "good",
    "mood_after": "great",
    "energy_level_before": "high",
    "energy_level_after": "high",
    "time_of_day": "morning",
    "is_successful": true
  }')

echo "Completion response: $COMPLETION"
echo ""

# Step 4: Get completions
echo "4️⃣ Fetching completions..."
COMPLETIONS=$(curl -s http://localhost:8000/api/completions \
  -H "Authorization: Bearer $TOKEN")

echo "Completions: $COMPLETIONS"
echo ""

echo "✅ Test complete!"
