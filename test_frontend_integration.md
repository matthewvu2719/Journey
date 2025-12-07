# Frontend Integration Test Plan

## Quick Test Checklist

### 1. API Service Tests ✅

Test all new API methods are accessible:

```javascript
// In browser console:
import { api } from './services/api'

// Test agent chat
await api.agentChat("Create a habit to run 30 minutes daily")

// Test habit parsing
await api.parseHabit("Meditate for 10 minutes every morning")

// Test duration prediction
await api.predictDuration({ name: "Running", estimated_duration: 30, target_frequency: 3 })

// Test difficulty estimation
await api.estimateDifficulty({ name: "Daily Meditation", target_frequency: 7 })

// Test time budget
await api.getTimeBudget()

// Test recommendations
await api.getMLRecommendations(5)

// Test model status
await api.getModelStatus()
```

### 2. Component Rendering Tests

#### Test DurationPrediction
1. Create a habit with estimated_duration
2. Verify prediction appears below duration input
3. Check confidence bar displays
4. Click "Apply suggestion" button
5. Verify duration updates

#### Test DifficultyIndicator
1. Fill out habit form
2. Verify difficulty indicator appears
3. Check color coding (green/yellow/orange/red)
4. Verify suggestions display
5. Check emoji matches difficulty level

#### Test TimeBudgetWidget
1. Navigate to Overview tab
2. Verify widget displays
3. Check progress bar shows correct percentage
4. Verify weekday/weekend breakdown
5. Click refresh button

#### Test RecommendationCards
1. Navigate to AI Insights tab
2. Verify recommendations load
3. Check success probability displays
4. Click "Add This Habit" button
5. Verify habit form pre-fills

#### Test AgentChatBot
1. Navigate to AI Coach tab
2. Type a message
3. Verify response appears
4. Check suggestions display
5. Test action execution

#### Test SmartHabitForm
1. Click "Smart Habit" button
2. Toggle "Use AI Parser"
3. Type natural language habit
4. Click "Parse with AI"
4. Verify form fills automatically
5. Check predictions appear

### 3. Integration Flow Tests

#### Flow 1: Create Habit with AI
```
1. Click "Smart Habit" button
2. Click "Use AI Parser"
3. Type: "Run for 30 minutes every morning"
4. Click "Parse with AI"
5. Verify form fills:
   - name: "Run"
   - duration: 30
   - frequency: 7
   - time: "morning"
6. Check duration prediction appears
7. Check difficulty indicator shows
8. Click "Create Habit"
9. Verify habit appears in list
```

#### Flow 2: Chat with Agent
```
1. Navigate to "AI Coach" tab
2. Type: "I want to start meditating"
3. Send message
4. Verify agent responds
5. Check for action suggestions
6. Execute suggested action
7. Verify habit created
```

#### Flow 3: Get Recommendations
```
1. Navigate to "AI Insights" tab
2. Wait for recommendations to load
3. Click on a recommendation card
4. Click "Add This Habit"
5. Verify habit form opens with pre-filled data
6. Submit form
7. Verify habit created
```

#### Flow 4: Check Time Budget
```
1. Create multiple habits
2. View Time Budget Widget
3. Verify capacity calculation
4. Add more habits until overloaded
5. Check warning appears
6. Verify recommendations display
```

### 4. Error Handling Tests

#### Test API Failures
1. Stop backend server
2. Try to create habit
3. Verify error message displays
4. Restart backend
5. Retry action
6. Verify success

#### Test Missing Data
1. Try predictions with no habits
2. Verify fallback behavior
3. Check default values display
4. Verify no crashes

#### Test Invalid Input
1. Submit empty habit form
2. Verify validation errors
3. Enter invalid duration (negative)
4. Check error messages
5. Fix errors and resubmit

### 5. Performance Tests

#### Load Time
- [ ] Dashboard loads in <2 seconds
- [ ] Components render in <100ms
- [ ] API calls complete in <500ms
- [ ] No lag when typing in chat

#### Memory
- [ ] No memory leaks after 10 minutes
- [ ] Components unmount cleanly
- [ ] Event listeners removed
- [ ] No console errors

### 6. Responsive Design Tests

#### Mobile (375px)
- [ ] Dashboard layout adapts
- [ ] Forms are usable
- [ ] Chat interface works
- [ ] Buttons are tappable
- [ ] Text is readable

#### Tablet (768px)
- [ ] Grid layouts adjust
- [ ] Sidebar navigation works
- [ ] Cards display properly
- [ ] Charts are visible

#### Desktop (1920px)
- [ ] Full layout displays
- [ ] No excessive whitespace
- [ ] Optimal use of screen space
- [ ] All features accessible

### 7. Accessibility Tests

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Focus indicators visible
- [ ] ARIA labels present

### 8. Browser Compatibility

#### Chrome
- [ ] All features work
- [ ] No console errors
- [ ] Animations smooth

#### Firefox
- [ ] All features work
- [ ] No console errors
- [ ] Animations smooth

#### Safari
- [ ] All features work
- [ ] No console errors
- [ ] Animations smooth

#### Edge
- [ ] All features work
- [ ] No console errors
- [ ] Animations smooth

---

## Manual Testing Script

### Setup
```bash
# Terminal 1: Start backend
cd habit-coach/backend
uvicorn main:app --reload

# Terminal 2: Start frontend
cd habit-coach/frontend
npm run dev

# Open browser to http://localhost:5173
```

### Test Sequence

1. **Initial Load**
   - Open app
   - Login/Guest mode
   - Verify dashboard loads
   - Check no console errors

2. **Create Smart Habit**
   - Click "Smart Habit"
   - Use AI parser: "Exercise 45 minutes 3 times per week"
   - Verify parsing works
   - Check predictions appear
   - Submit form
   - Verify habit created

3. **Chat with AI**
   - Go to AI Coach tab
   - Ask: "When should I schedule my workout?"
   - Verify response
   - Try: "Create a habit to read 20 minutes daily"
   - Execute action
   - Verify habit created

4. **View Recommendations**
   - Go to AI Insights tab
   - Wait for recommendations
   - Click "Add This Habit" on one
   - Verify form pre-fills
   - Submit
   - Verify habit created

5. **Check Time Budget**
   - View Overview tab
   - Check Time Budget Widget
   - Verify calculations
   - Add more habits
   - Check for overload warning

6. **Complete Habits**
   - Click "Complete" on habits
   - Verify logs created
   - Check stats update
   - Verify streak increases

7. **Floating Chat**
   - Click floating chat button
   - Send message
   - Verify agent responds
   - Close chat
   - Reopen and verify history

---

## Automated Test Commands

```bash
# Run frontend tests (if implemented)
cd habit-coach/frontend
npm test

# Run E2E tests (if implemented)
npm run test:e2e

# Check for TypeScript errors
npm run type-check

# Lint code
npm run lint
```

---

## Expected Results

### All Tests Pass ✅
- No console errors
- All features functional
- Smooth user experience
- Fast load times
- Responsive design works
- Accessible to all users

### Known Issues
- First ML prediction may be slow (model loading)
- Agent chat requires backend models loaded
- Recommendations need training data

---

## Bug Report Template

```markdown
**Bug Description:**
[Clear description of the issue]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [etc.]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots:**
[If applicable]

**Environment:**
- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- Screen size: [e.g., 1920x1080]

**Console Errors:**
[Any errors from browser console]
```

---

## Success Criteria

✅ All components render without errors  
✅ All API calls succeed  
✅ AI predictions display correctly  
✅ Natural language parsing works  
✅ Recommendations are personalized  
✅ Time budget calculates accurately  
✅ Chat interface is responsive  
✅ Forms validate properly  
✅ Error handling is graceful  
✅ Performance is acceptable  

---

**Test Status: Ready for Testing** ✅

