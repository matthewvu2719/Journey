# Achievement System - Bobo Rewards

## Overview
A focused achievement system that rewards users with Bobo customizations and motivational content.

## 4 Achievement Types

### 1. 🎯 Any Completion
**Trigger:** Complete any habit  
**Reward:** New motivational sentence  
**Frequency:** Every completion  

**Motivational Sentences Library (15 total):**
- "You're crushing it! Keep going! 💪"
- "One step closer to your goals! 🎯"
- "Consistency is your superpower! ⚡"
- "You're building something amazing! 🌟"
- "Small wins lead to big victories! 🏆"
- And 10 more...

### 2. ⭐ 100% Daily Perfect
**Trigger:** Complete 100% of today's scheduled habits  
**Reward:** New dance + emotion for Bobo  
**Frequency:** Once per perfect day  

**Dances (8 total):**
- Wiggle Dance
- Spin Move
- Wave Arms
- Happy Bounce
- Shimmy Shake
- Victory Pose
- Moonwalk
- Robot Dance

**Emotions (4 total):**
- Super Happy (extra wide smile)
- Wink (playful wink)
- Star Eyes (eyes turn to stars)
- Heart Eyes (eyes turn to hearts)

### 3. 🏆 100% Weekly Perfect
**Trigger:** Complete 100% of this week's scheduled habits  
**Reward:** New hat + costume for Bobo  
**Frequency:** Once per perfect week  

**Hats (6 total):**
- Party Hat
- Crown
- Baseball Cap
- Wizard Hat
- Top Hat
- Halo

**Costumes (4 total):**
- Superhero Cape
- Bow Tie
- Scarf
- Wings

### 4. 👑 100% Monthly Perfect
**Trigger:** Complete 100% of this month's scheduled habits  
**Reward:** New theme  
**Frequency:** Once per perfect month  

**Themes (6 total):**
- Sunset Glow (warm orange and pink)
- Ocean Breeze (cool blues and teals)
- Forest Green (natural greens)
- Galaxy (deep purples and blues)
- Autumn Leaves (warm browns and oranges)
- Cherry Blossom (soft pinks)

## Architecture

### Backend Components

**1. achievement_engine.py**
- Core achievement tracking logic
- Reward unlocking system
- Progress calculation
- Random reward selection

**2. API Endpoints**
```
POST /api/achievements/check
  - Check for newly unlocked achievements
  - Called after each habit completion
  - Returns list of unlocked rewards

GET /api/achievements/progress
  - Get current progress (daily/weekly/monthly)
  - Shows percentage completion
  - Used for progress bars

GET /api/achievements/rewards
  - Get all available rewards
  - Returns complete libraries
  - Used for gallery/preview
```

**3. Database Models**
```python
UnlockedReward
  - user_id
  - reward_type
  - reward_data (JSON)
  - unlocked_at
  - achievement_type

AchievementProgress
  - daily_progress (completed/total/percentage)
  - weekly_progress
  - monthly_progress
  - total_completions
```

### Frontend Components (To Be Built)

**1. Achievement Notification**
- Popup when achievement unlocked
- Shows Bobo celebrating
- Displays reward details
- Animated entrance

**2. Progress Tracker**
- Shows progress bars for each achievement type
- Real-time updates
- Visual indicators

**3. Rewards Gallery**
- View all unlocked items
- Preview locked items
- Select active customizations

**4. Enhanced RobotMascot**
- Support for multiple dances
- Support for emotions
- Support for hats/costumes
- Dynamic rendering

## User Flow

### Completing a Habit
```
1. User completes habit
   ↓
2. Frontend calls POST /api/completions
   ↓
3. Backend saves completion
   ↓
4. Frontend calls POST /api/achievements/check
   ↓
5. Backend checks all achievement conditions
   ↓
6. Returns unlocked achievements (if any)
   ↓
7. Frontend shows notification
   ↓
8. Bobo celebrates with new animation
   ↓
9. Reward added to user's collection
```

### Viewing Progress
```
1. User opens dashboard
   ↓
2. Frontend calls GET /api/achievements/progress
   ↓
3. Backend calculates current progress
   ↓
4. Frontend displays progress bars
   ↓
5. User sees how close to next reward
```

## Implementation Status

### ✅ Completed
- Achievement engine logic
- Progress calculation
- Reward libraries
- API endpoints
- Database models

### 🚧 To Do
- Database table creation (Supabase)
- Frontend achievement notification component
- Frontend progress tracker component
- Frontend rewards gallery
- Enhanced RobotMascot with customizations
- Integration with completion flow
- Local storage for unlocked items
- Animation implementations

## Next Steps

1. **Create Database Tables** (Supabase)
   - `unlocked_rewards` table
   - Migration script

2. **Frontend Integration**
   - Call achievement check after completions
   - Display unlock notifications
   - Show progress in dashboard

3. **Bobo Enhancements**
   - Implement dance animations
   - Add emotion variations
   - Add hat/costume rendering
   - Create customization selector

4. **Testing**
   - Test achievement triggers
   - Test reward unlocking
   - Test progress calculation
   - Test UI notifications

## Future Enhancements

- Achievement history/timeline
- Share achievements on social media
- Achievement leaderboard
- Special seasonal rewards
- Combo achievements (multiple perfect days in a row)
- Custom reward creation
- Bobo personality evolution based on achievements
