# Success Utility Examples 🌟

## Understanding Success Utility

Every completion has a **utility score** from 1.0 to 2.0:
- **1.0** = Basic success (you did it!)
- **1.5** = Good success (positive experience)
- **2.0** = Exceptional success (felt amazing!)

---

## Example 1: Morning Run - Exceptional Success ⭐⭐⭐

```json
{
  "habit": "Morning Run",
  "estimated_duration": 30,
  "actual_duration": 25,
  "mood_before": "okay",
  "mood_after": "great",
  "energy_before": "medium",
  "energy_after": "high"
}
```

**Utility Calculation:**
- Base: 1.0 (completed)
- Mood bonus: +0.5 (felt great after)
- Energy bonus: +0.3 (high energy after)
- Duration bonus: +0.2 (finished in 25/30 min)
- **Total Utility: 2.0** ⭐⭐⭐

**What this means:**
- This habit is PERFECT for you!
- You should do more of this
- ML will recommend similar habits
- High priority to maintain

---

## Example 2: Evening Study - Good Success ⭐⭐

```json
{
  "habit": "Evening Study",
  "estimated_duration": 45,
  "actual_duration": 45,
  "mood_before": "good",
  "mood_after": "good",
  "energy_before": "medium",
  "energy_after": "medium"
}
```

**Utility Calculation:**
- Base: 1.0 (completed)
- Mood bonus: +0.3 (felt good after)
- Energy bonus: +0.3 (maintained medium energy)
- Duration bonus: +0.1 (on time)
- **Total Utility: 1.7** ⭐⭐

**What this means:**
- Solid habit, sustainable
- Not draining, not super energizing
- Good for consistency
- Keep it up!

---

## Example 3: Gym Workout - Basic Success ⭐

```json
{
  "habit": "Gym Workout",
  "estimated_duration": 60,
  "actual_duration": 75,
  "mood_before": "good",
  "mood_after": "okay",
  "energy_before": "high",
  "energy_after": "low"
}
```

**Utility Calculation:**
- Base: 1.0 (completed)
- Mood bonus: +0.0 (mood decreased)
- Energy bonus: +0.0 (energy decreased)
- Duration bonus: +0.0 (took longer than planned)
- **Total Utility: 1.0** ⭐

**What this means:**
- You completed it, but it was hard
- Might be too intense
- ML might suggest:
  - Reduce duration to 45 min
  - Change time of day
  - Lower intensity
- Still counts as success!

---

## Example 4: Meditation - High Quality ⭐⭐⭐

```json
{
  "habit": "Morning Meditation",
  "estimated_duration": 15,
  "actual_duration": 12,
  "mood_before": "poor",
  "mood_after": "good",
  "energy_before": "low",
  "energy_after": "medium"
}
```

**Utility Calculation:**
- Base: 1.0 (completed)
- Mood bonus: +0.5 (improved from poor to good)
- Energy bonus: +0.15 (improved from low to medium)
- Duration bonus: +0.2 (finished early)
- **Total Utility: 1.85** ⭐⭐⭐

**What this means:**
- Transformative habit!
- Improves your state significantly
- High value despite short duration
- ML will prioritize this

---

## How ML Uses Utility Scores

### Difficulty Estimator:
```
High utility habits → Easy/enjoyable for you
Low utility habits → Hard/draining for you
```

### Duration Predictor:
```
Consistent utility → Sustainable pace
Declining utility → Might be taking too long
```

### Recommendation Engine:
```
Suggests habits similar to your high-utility ones
Avoids patterns from low-utility completions
```

---

## Utility Trends Over Time

### Healthy Pattern 📈
```
Week 1: Avg utility 1.2
Week 2: Avg utility 1.4
Week 3: Avg utility 1.6
Week 4: Avg utility 1.7
```
**Interpretation:** Habit is becoming easier and more enjoyable!

### Warning Pattern 📉
```
Week 1: Avg utility 1.8
Week 2: Avg utility 1.5
Week 3: Avg utility 1.2
Week 4: Avg utility 1.0
```
**Interpretation:** Habit is becoming harder. Time to adjust!

---

## Key Insights

1. **All completions count** - Even utility 1.0 is success
2. **Quality matters** - High utility = sustainable long-term
3. **ML learns YOUR patterns** - What works for you specifically
4. **Trends are important** - Improving or declining utility signals changes needed

**Remember:** A habit with consistent 1.3 utility is better than one that alternates between 2.0 and 1.0! 🎯
