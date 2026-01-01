import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - inject Bearer token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('habit_coach_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor - handle 401 errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on unauthorized
      localStorage.removeItem('habit_coach_token')
      localStorage.removeItem('habit_coach_user')
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export const api = {
  // Authentication
  login: async (email, password) => {
    const { data } = await client.post('/api/auth/signin', { email, password })
    return data
  },

  signup: async (email, password, name = null) => {
    const payload = { email, password }
    if (name) payload.name = name
    const { data } = await client.post('/api/auth/signup', payload)
    return data
  },

  guestLogin: async (deviceId) => {
    const { data } = await client.post('/api/auth/guest', { device_id: deviceId })
    return data
  },

  logout: async () => {
    const { data } = await client.post('/api/auth/signout')
    return data
  },

  getMe: async () => {
    const { data } = await client.get('/api/auth/me')
    return data
  },

  // Habits
  getHabits: async () => {
    const { data } = await client.get('/api/habits')
    return data
  },
  
  createHabit: async (habit) => {
    const { data } = await client.post('/api/habits', habit)
    return data
  },
  
  updateHabit: async (id, habit) => {
    const { data } = await client.put(`/api/habits/${id}`, habit)
    return data
  },
  
  deleteHabit: async (id) => {
    await client.delete(`/api/habits/${id}`)
  },
  
  // Logs (Legacy - maps to completions)
  getLogs: async (habitId = null) => {
    const params = habitId ? { habit_id: habitId } : {}
    const { data } = await client.get('/api/logs', { params })
    return data
  },
  
  createLog: async (log) => {
    const { data } = await client.post('/api/logs', log)
    return data
  },
  
  getLogStats: async () => {
    const { data } = await client.get('/api/logs/stats')
    return data
  },
  
  // Completions
  getCompletions: async (params = {}) => {
    // params can include: habit_id, start_date, end_date
    const { data } = await client.get('/api/completions', { params })
    return data
  },
  
  createCompletion: async (completion) => {
    // Enhanced completion creation includes timezone offset for immediate stats update
    const timezoneOffset = -new Date().getTimezoneOffset()
    const { data } = await client.post('/api/completions', completion, {
      params: { timezone_offset: timezoneOffset }
    })
    return data
  },
  
  getCompletion: async (id) => {
    const { data } = await client.get(`/api/completions/${id}`)
    return data
  },
  
  deleteCompletion: async (id) => {
    // Enhanced completion deletion includes timezone offset for immediate stats update
    const timezoneOffset = -new Date().getTimezoneOffset()
    await client.delete(`/api/completions/${id}`, {
      params: { timezone_offset: timezoneOffset }
    })
  },

  // Helper to get today's completions
  getTodayCompletions: async () => {
    const today = new Date().toISOString().split('T')[0]
    return api.getCompletions({ start_date: today, end_date: today })
  },

  // Helper to check if habit instance is completed
  isHabitCompleted: (habitId, date, timeOfDayId, completions) => {
    return completions.some(c => 
      c.habit_id === habitId &&
      c.completed_date === date &&
      c.time_of_day_id === timeOfDayId
    )
  },
  
  // Timetable (Phase 2)
  generateTimetable: async (request) => {
    const { data } = await client.post('/api/timetable/generate', request)
    return data
  },
  
  getWeeklySchedule: async () => {
    const { data } = await client.get('/api/timetable/weekly')
    return data
  },
  
  getTimetableSlots: async () => {
    const { data } = await client.get('/api/timetable/slots')
    return data
  },
  
  // Timer (Phase 2)
  startTimer: async (request) => {
    const { data } = await client.post('/api/timer/start', request)
    return data
  },
  
  stopTimer: async (request) => {
    const { data } = await client.post('/api/timer/stop', request)
    return data
  },
  
  // ML/AI
  getRecommendations: async () => {
    const { data } = await client.get('/api/recommendations')
    return data
  },
  
  getAnalytics: async () => {
    const { data } = await client.get('/api/analytics')
    return data
  },

  getTodayStats: async () => {
    // Get user's timezone offset in minutes
    // getTimezoneOffset() returns positive for behind UTC, negative for ahead
    // We need to send the negative of this to the backend
    const timezoneOffset = -new Date().getTimezoneOffset()
    console.log('[API DEBUG] Sending timezone_offset:', timezoneOffset)
    const { data } = await client.get('/api/stats/today', {
      params: { timezone_offset: timezoneOffset }
    })
    console.log('[API DEBUG] Received stats:', data)
    return data
  },

  // Batch endpoint for dashboard data
  getDashboardData: async () => {
    // Get user's timezone offset in minutes
    // getTimezoneOffset() returns positive for behind UTC, negative for ahead
    // We need to send the negative of this to the backend
    const timezoneOffset = -new Date().getTimezoneOffset()
    console.log('[API DEBUG] getDashboardData sending timezone_offset:', timezoneOffset)
    const { data } = await client.get('/api/dashboard/data', {
      params: { timezone_offset: timezoneOffset }
    })
    console.log('[API DEBUG] getDashboardData received:', data)
    
    // Enhanced response format includes:
    // - habits: array of habits
    // - completions: array of today's completions
    // - stats: enhanced stats object with data_source and is_stored indicators
    // - timestamp: when the data was retrieved
    return data
  },
  
  chat: async (message, userId = 'default_user', timezoneOffset = null) => {
    // Get timezone offset if not provided
    if (timezoneOffset === null) {
      timezoneOffset = -new Date().getTimezoneOffset() // Convert to minutes from UTC
    }
    
    const { data } = await client.post('/api/chat', { 
      message, 
      user_id: userId,
      timezone_offset: timezoneOffset
    })
    return data
  },
  
  // Voice Call Scheduling
  scheduleCall: async (schedule) => {
    const { data } = await client.post('/api/voice/schedule-call', schedule)
    return data
  },
  
  getCallSchedule: async () => {
    const { data } = await client.get('/api/voice/schedule')
    return data
  },
  
  getCallHistory: async () => {
    const { data } = await client.get('/api/voice/call-history')
    return data
  },
  
  testCall: async (callData) => {
    const { data } = await client.post('/api/voice/test-call', callData)
    return data
  },
  
  // Phase 4: AI Agents
  agentChat: async (message, context = {}, userId = 'default_user', timezoneOffset = null) => {
    // Get timezone offset if not provided
    if (timezoneOffset === null) {
      timezoneOffset = -new Date().getTimezoneOffset() // Convert to minutes from UTC
    }
    
    const { data } = await client.post('/api/chat', { 
      message, 
      user_id: userId,
      timezone_offset: timezoneOffset,
      context 
    })
    return data
  },
  
  parseHabit: async (text) => {
    const { data } = await client.post('/api/agents/parse-habit', { text })
    return data
  },
  
  getAgentStatus: async () => {
    const { data } = await client.get('/api/agents/status')
    return data
  },
  
  // Phase 5: Machine Learning
  predictDuration: async (habit) => {
    const { data } = await client.post('/api/ml/predict-duration', { habit })
    return data
  },
  
  estimateDifficulty: async (habit, userData = {}) => {
    const { data } = await client.post('/api/ml/estimate-difficulty', { habit, user_data: userData })
    return data
  },
  
  getTimeBudget: async () => {
    const { data } = await client.get('/api/ml/time-budget')
    return data
  },
  
  getMLRecommendations: async (limit = 5) => {
    const { data } = await client.get('/api/ml/recommendations', { params: { limit } })
    return data
  },
  
  trainModels: async () => {
    const { data } = await client.post('/api/ml/models/train')
    return data
  },
  
  getModelStatus: async () => {
    const { data } = await client.get('/api/ml/models/status')
    return data
  },

  // ============================================================================
  // ACHIEVEMENTS
  // ============================================================================
  
  checkAchievements: async (completionDate = null) => {
    const params = completionDate ? { completion_date: completionDate } : {}
    const { data } = await client.post('/api/achievements/check', null, { params })
    return data
  },

  getAchievementProgress: async () => {
    const { data } = await client.get('/api/achievements/progress')
    return data
  },

  unlockDailyAchievement: async () => {
    const { data } = await client.post('/api/achievements/unlock/daily')
    return data
  },

  unlockWeeklyAchievement: async () => {
    const { data } = await client.post('/api/achievements/unlock/weekly')
    return data
  },

  unlockMonthlyAchievement: async () => {
    const { data } = await client.post('/api/achievements/unlock/monthly')
    return data
  },

  checkRewardClaimed: async (achievementType) => {
    const { data } = await client.get(`/api/achievements/claimed/${achievementType}`)
    return data.claimed
  },

  getAvailableRewards: async () => {
    const { data } = await client.get('/api/achievements/rewards')
    return data
  },

  // ============================================================================
  // BOBO CUSTOMIZATION
  // ============================================================================
  
  getEquippedCustomizations: async () => {
    const { data } = await client.get('/api/bobo/customizations')
    return data
  },

  equipCustomization: async (customizations) => {
    const { data } = await client.post('/api/bobo/equip', customizations)
    return data
  },

  getUnlockedRewards: async () => {
    const { data } = await client.get('/api/achievements/unlocked')
    return data
  },

  getBoboItems: async (itemType = null) => {
    const params = itemType ? { item_type: itemType } : {}
    const { data } = await client.get('/api/bobo/items', { params })
    return data
  },

  // ============================================================================
  // JOURNEY ACHIEVEMENTS
  // ============================================================================

  checkJourneyAchievements: async (obstacleType = null) => {
    const params = obstacleType ? { obstacle_type: obstacleType } : {}
    const { data } = await client.post('/api/journey/achievements/check', null, { params })
    return data
  },

  getJourneyAchievements: async () => {
    const { data } = await client.get('/api/journey/achievements')
    return data
  },

  getJourneyProgress: async () => {
    const { data } = await client.get('/api/journey/progress')
    return data
  },

  recordObstacleEncounter: async (obstacleData) => {
    const { data } = await client.post('/api/journey/obstacle/encounter', obstacleData)
    return data
  },

  resolveObstacleEncounter: async (encounterId, resolutionData) => {
    const { data } = await client.post(`/api/journey/obstacle/resolve/${encounterId}`, resolutionData)
    return data
  },

  // ============================================================================
  // TESTING
  // ============================================================================
  
  triggerTestAchievement: async (type) => {
    const { data } = await client.post(`/api/test/trigger-achievement?achievement_type=${type}`)
    return data
  },

  unlockTestItems: async () => {
    const { data } = await client.post('/api/test/unlock-items')
    return data
  },

  // ============================================================================
  // DAILY SUCCESS RATES
  // ============================================================================
  
  getSuccessRateForDate: async (date) => {
    const { data } = await client.get(`/api/success-rates/date/${date}`)
    return data
  },

  getSuccessRatesRange: async (startDate, endDate, timezoneOffset = null) => {
    // Get timezone offset if not provided
    if (timezoneOffset === null) {
      timezoneOffset = -new Date().getTimezoneOffset() // Convert to minutes from UTC
    }
    
    const { data } = await client.get('/api/success-rates/range', {
      params: { 
        start_date: startDate, 
        end_date: endDate,
        timezone_offset: timezoneOffset
      }
    })
    return data
  },

  calculateDailySuccessRate: async (date) => {
    const { data } = await client.post(`/api/success-rates/calculate/${date}`)
    return data
  },

  // ============================================================================
  // FRICTION HELPER
  // ============================================================================
  
  getFrictionHelp: async (habitId, request) => {
    const { data } = await client.post(`/api/habits/${habitId}/friction-help`, request)
    return data
  },

  updateFrictionFeedback: async (sessionId, actionTaken, wasHelpful) => {
    const { data } = await client.post(`/api/friction-sessions/${sessionId}/feedback`, {
      action_taken: actionTaken,
      was_helpful: wasHelpful
    })
    return data
  },

  getUserEnergyPatterns: async () => {
    const { data } = await client.get('/api/users/energy-patterns')
    return data
  },

  // ============================================================================
  // HABIT BREAKDOWN
  // ============================================================================
  
  createHabitBreakdown: async (habitId, subtasks, preserveOriginal = false) => {
    const { data } = await client.post(`/api/habits/${habitId}/breakdown`, {
      subtasks: subtasks,
      preserve_original: preserveOriginal
    })
    return data
  },

  getHabitSubtasks: async (habitId) => {
    const { data } = await client.get(`/api/habits/${habitId}/subtasks`)
    return data
  },

  getHabitWithSubtasks: async (habitId) => {
    const { data } = await client.get(`/api/habits/${habitId}/with-subtasks`)
    return data
  },

  getHabitBreakdown: async (breakdownSessionId) => {
    const { data } = await client.get(`/api/breakdowns/${breakdownSessionId}`)
    return data
  },

  rollbackHabitBreakdown: async (breakdownSessionId, restoreOriginal = true) => {
    const { data } = await client.post(`/api/breakdowns/${breakdownSessionId}/rollback`, {
      breakdown_session_id: breakdownSessionId,
      restore_original: restoreOriginal
    })
    return data
  }
}