# ML Training System - Active Learning 🎓

Your Journey app now has **active machine learning** that continuously learns from your habit completion data!

## How It Works

### 1. **On Every Habit Completion** ✅

When you complete a habit (with mood, energy, duration data):

```
User completes habit → Data saved to database → 
ML Trainer checks if training needed → 
If yes: Retrain models with new data → 
Models improve predictions
```

**Training Triggers:**
- ✅ Minimum 10 completions collected
- ✅ At least 5 new completions since last training
- ✅ At least 1 hour since last training (prevents over-training)

### 2. **Daily Training Check** 🌅

Every day at 2 AM, the system:
- Checks all active users
- Retrains models if enough new data
- Skips inactive users (7+ days without completions)

### 3. **What Gets Trained**

**Difficulty Estimator:**
- Learns which habits are hard/easy for YOU
- Predicts success probability for new habits
- Uses Gradient Boosting Classifier

**Duration Predictor:**
- Learns how long habits REALLY take you
- Compares planned vs actual durations
- Uses Random Forest Regressor

**Recommendation Engine:**
- Analyzes your success patterns
- Suggests habits that match your style
- Uses pattern analysis (no training needed)

## Data Used for Training

The models learn from:

### Habit Properties
- Name, category, type (atomic/big)
- Frequency (1-7 times/week)
- Duration (estimated minutes)
- Difficulty (easy/medium/hard)
- Priority (1-10)
- Preferred time of day

### Completion Data
- **When**: Date, time, day of week
- **Duration**: How long it actually took
- **Mood**: Before and after (poor/okay/good/great)
- **Energy**: Before and after (low/medium/high)
- **Success**: If it's in habit_completions, it's successful! ✅
- **Quality Score**: Mood, energy, and duration determine HOW WELL you did
- **Notes**: Any comments

### Behavioral Patterns
- Success rate per category
- Best times of day
- Consistency (gaps between completions)
- Recent performance trends
- Mood/energy correlations

## API Endpoints

### Check Training Status
```bash
GET /api/ml/training-status?user_id=your_id
```

Returns:
```json
{
  "user_id": "your_id",
  "total_completions": 25,
  "new_completions_since_training": 3,
  "last_training_time": "2025-12-08T10:30:00",
  "min_samples_required": 10,
  "retrain_threshold": 5,
  "models_available": {
    "difficulty_estimator": true,
    "duration_predictor": true
  }
}
```

### Manually Trigger Training
```bash
POST /api/ml/train?user_id=your_id
```

Returns training results and metrics.

### Daily Training Check
```bash
POST /api/ml/daily-check?user_id=your_id
```

Runs the daily training check manually.

## Training Metrics

When models are trained, you get metrics like:

**Difficulty Estimator:**
- Accuracy: How often it predicts correctly
- Train/test samples: Data split
- Trained timestamp

**Duration Predictor:**
- MAE (Mean Absolute Error): Average prediction error in minutes
- R² Score: How well it fits your data (0-1, higher is better)
- Within 20%: Percentage of predictions within 20% of actual

## Privacy & Data

- ✅ Models train ONLY on YOUR data
- ✅ No data shared between users
- ✅ All data stays in your Supabase database
- ✅ Models saved locally per user
- ✅ Can be deleted anytime

## Requirements

The ML training requires:
- **Minimum 10 completions** to start training
- **scikit-learn** installed (for ML models)
- **PyTorch** (for deep learning features)

## Monitoring

Check logs for training activity:
```
🎓 Triggering ML training for user guest
✓ Difficulty Estimator trained: {'accuracy': 0.85, 'samples': 20}
✓ Duration Predictor trained: {'mae': 5.2, 'r2_score': 0.78}
✅ Training complete: 2 models trained
```

## Benefits

As you use the app more:
- 📈 **Better predictions**: Models learn YOUR patterns
- 🎯 **Personalized recommendations**: Suggests habits that work for YOU
- ⏱️ **Accurate time estimates**: Knows how long YOU take
- 💡 **Smarter insights**: Understands YOUR success factors

The more you use Journey, the smarter it gets! 🚀
