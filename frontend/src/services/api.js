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
      // Redirect to login page
      window.location.href = '/login'
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
    const { data } = await client.post('/api/completions', completion)
    return data
  },
  
  getCompletion: async (id) => {
    const { data } = await client.get(`/api/completions/${id}`)
    return data
  },
  
  deleteCompletion: async (id) => {
    await client.delete(`/api/completions/${id}`)
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
  
  chat: async (message, userId = 'default_user') => {
    const { data } = await client.post('/api/chat', { message, user_id: userId })
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
  agentChat: async (message, context = {}) => {
    const { data } = await client.post('/api/agents/chat', { message, context })
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
  }
}

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

  getAvailableRewards: async () => {
    const { data } = await client.get('/api/achievements/rewards')
    return data
  },
