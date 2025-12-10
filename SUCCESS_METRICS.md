# Success Metrics - How Journey Measures Success 📊

## Simple Rule: Completion = Success ✅

**If a habit is in the `habit_completions` table, it's successful!**

The philosophy is simple:
- You completed the habit → Success! 🎉
- You logged it → You did it → That's a win!

## Success Utility: Not All Successes Are Equal 🌟

While every completion is a success, some are **better** than others:

**Base Success = 1.0** (you did it!)

**Bonus Utility:**
- 😊 Mood improved or great after: **+0.5**
- ⚡ Energy maintained or high: **+0.3**
- ⏱️ Finished faster than estimated: **+0.2**

**Maximum Utility = 2.0** (exceptional success!)

## Success Rate Calculation

### Basic Success Rate (Binary):
```
Success Rate = (Number of Completions) / (Expected Completions)
```

For example:
- Habit: "Morning Run" (3x per week)
- Week 1: Completed 3 times → 100% success rate ✅
- Week 2: Completed 2 times → 67% success rate 📈
- Week 3: Completed 0 times → 0% success rate (no completions logged)

### Weighted Success Rate (Quality-Adjusted):
```
Weighted Rate = (Total Utility) / (Expected Completions × 2.0)
```

Example:
- Week 1: 3 completions
  - Mon: utility 1.8 (felt great, high energy)
  - Wed: utility 1.2 (okay mood, maintained energy)
  - Fri: utility 1.0 (basic completion)
  - Total utility: 4.0
  - Weighted rate: 4.0 / (3 × 2.0) = **67%** (good quality)

- Week 2: 3 completions
  - Mon: utility 1.0
  - Wed: utility 1.1
  - Fri: utility 1.0
  - Total utility: 3.1
  - Weighted rate: 3.1 / (3 × 2.0) = **52%** (lower quality)

## Quality Score (0.0 - 1.0)

While every completion is a success, we also measure **HOW WELL** you did:

### Quality Factors:

**1. Mood Impact (0-1)**
- Great mood after: 1.0
- Good mood after: 0.67
- Okay mood after: 0.33
- Poor mood after: 0.0
- Bonus: +0.2 if mood improved

**2. Energy Impact (0-1)**
- High energy after: 1.0
- Medium energy after: 0.5
- Low energy after: 0.0
- Bonus: +0.1 if energy maintained/increased

**3. Duration Efficiency (0-1)**
- Finished early: 1.0
- On time (≤ estimated): 1.0
- Within 150%: 0.5 - 1.0 (linear)
- Over 150%: 0.0

**Quality Score = Average of available factors**

### Examples:

**High Quality Completion:**
```json
{
  "mood_before": "okay",
  "mood_after": "great",
  "energy_before": "medium", 
  "energy_after": "high",
  "actual_duration": 25,
  "estimated_duration": 30
}
```
Quality Score: **0.95** (Excellent! 🌟)

**Medium Quality Completion:**
```json
{
  "mood_before": "good",
  "mood_after": "good",
  "energy_before": "high",
  "energy_after": "medium",
  "actual_duration": 40,
  "estimated_duration": 30
}
```
Quality Score: **0.61** (Good, but took longer)

**Low Quality Completion:**
```json
{
  "mood_before": "good",
  "mood_after": "poor",
  "energy_before": "high",
  "energy_after": "low",
  "actual_duration": 60,
  "estimated_duration": 30
}
```
Quality Score: **0.17** (Completed, but struggled)

## How ML Uses This Data

### Difficulty Estimator
Learns which habits have:
- **High success rate** (completed often) → Easy for you
- **Low success rate** (completed rarely) → Hard for you
- **High quality scores** → Enjoyable/sustainable
- **Low quality scores** → Draining/challenging

### Duration Predictor
Learns:
- Your actual vs estimated durations
- Which habits take longer than planned
- Your personal pace for different activities

### Recommendation Engine
Suggests habits based on:
- Categories with high success rates
- Times of day with high quality scores
- Patterns that work for YOU

## What This Means

✅ **Every completion counts** - No such thing as a "failed" completion
📊 **Quality matters** - Mood, energy, and duration show how sustainable the habit is
🎯 **ML learns YOUR patterns** - What works for you specifically
💡 **Better recommendations** - Suggests habits you'll actually stick with

## Legacy Support

For the old `habit_logs` table, we check the `is_successful` field:
- `is_successful: true` → Success
- `is_successful: false` → Not successful (rare, for tracking attempts)

But for the main `habit_completions` table:
- **If it's logged, it's successful!** ✅

---

**Remember:** The goal isn't perfection, it's consistency. Every completion is progress! 🚀
