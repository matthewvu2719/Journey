export default function WeeklySchedule({ habits, completions = [] }) {
  const days = [
    { full: 'Monday', short: 'Mon' },
    { full: 'Tuesday', short: 'Tue' },
    { full: 'Wednesday', short: 'Wed' },
    { full: 'Thursday', short: 'Thu' },
    { full: 'Friday', short: 'Fri' },
    { full: 'Saturday', short: 'Sat' },
    { full: 'Sunday', short: 'Sun' }
  ]

  const timesOfDay = [
    { id: 1, name: 'morning', label: 'Morning', icon: '🌅' },
    { id: 2, name: 'noon', label: 'Noon', icon: '☀️' },
    { id: 3, name: 'afternoon', label: 'Afternoon', icon: '🌤️' },
    { id: 4, name: 'night', label: 'Night', icon: '🌙' }
  ]

  // Map day names to dates for this week
  const getDateForDay = (dayShort) => {
    const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 }
    const today = new Date()
    const currentDay = today.getDay()
    const targetDay = dayMap[dayShort]
    const diff = targetDay - currentDay
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + diff)
    return targetDate.toISOString().split('T')[0]
  }
  
  // Check if specific habit instance is completed
  const isInstanceCompleted = (habitId, dayShort, timeOfDayId) => {
    const date = getDateForDay(dayShort)
    return completions.some(c => 
      c.habit_id === habitId && 
      c.completed_date === date &&
      c.time_of_day_id === timeOfDayId
    )
  }

  // Check if a habit is overdue (past date and not completed)
  const isOverdue = (habit, dayShort, timeOfDayId) => {
    const date = getDateForDay(dayShort)
    const today = new Date().toISOString().split('T')[0]
    const isPast = date < today
    const completed = isInstanceCompleted(habit.id, dayShort, timeOfDayId)
    
    // Get habit creation date (just the date part, no time)
    const habitCreatedDate = habit.created_at ? habit.created_at.split('T')[0] : null
    
    // Only mark as overdue if:
    // 1. Date is in the past
    // 2. Habit is not completed
    // 3. Date is on or after the habit was created
    const isAfterCreation = !habitCreatedDate || date >= habitCreatedDate
    
    return isPast && !completed && isAfterCreation
  }

  // Get habits for a specific day and time
  const getHabitsForDayAndTime = (dayShort, timeName) => {
    return habits.filter(habit => {
      const hasDay = habit.days && habit.days.includes(dayShort)
      const hasTime = habit.times_of_day && habit.times_of_day.includes(timeName)
      return hasDay && hasTime
    }).sort((a, b) => (b.priority || 5) - (a.priority || 5))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-light mb-2">Weekly Schedule</h2>
        <p className="text-light/60">All your habits organized by day and time</p>
      </div>

      {/* Weekly Schedule Grid - Split by Time of Day */}
      {habits.length > 0 ? (
        <div className="glass rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4">
            {days.map((day) => (
              <div key={day.short} className="bg-light/5 rounded-xl p-4">
                <h4 className="font-bold text-sm uppercase tracking-wider text-light/80 mb-3">
                  {day.full}
                </h4>
                
                {/* Time of Day Sections */}
                <div className="space-y-3">
                  {timesOfDay.map((time) => {
                    const timeHabits = getHabitsForDayAndTime(day.short, time.name)
                    
                    // Skip empty time slots
                    if (timeHabits.length === 0) return null
                    
                    return (
                      <div key={time.id} className="space-y-1">
                        {/* Time Header */}
                        <div className="text-xs font-semibold text-light/60 uppercase tracking-wide flex items-center gap-1">
                          <span>{time.icon}</span>
                          <span>{time.label}</span>
                        </div>
                        
                        {/* Habits for this time */}
                        <div className="space-y-1">
                          {timeHabits.map(habit => {
                            const isCompleted = isInstanceCompleted(habit.id, day.short, time.id)
                            const isPastDue = isOverdue(habit, day.short, time.id)
                            const difficultyColors = {
                              easy: 'bg-green-500/20 text-green-300',
                              medium: 'bg-yellow-500/20 text-yellow-300',
                              hard: 'bg-red-500/20 text-red-300'
                            }
                            const difficultyColor = difficultyColors[habit.difficulty] || difficultyColors.medium
                            
                            // Determine card styling based on status
                            let cardStyle = 'bg-light/10' // Default: upcoming/today/incomplete future
                            if (isCompleted) {
                              cardStyle = 'bg-green-500/20 border border-green-500/30' // Completed
                            } else if (isPastDue) {
                              cardStyle = 'bg-red-500/20 border border-red-500/30' // Overdue (past + incomplete)
                            }
                            
                            return (
                              <div
                                key={`${habit.id}-${time.id}`}
                                className={`p-2 rounded-lg transition-all ${cardStyle}`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="text-sm font-medium text-light">{habit.name}</div>
                                  {isCompleted && (
                                    <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 flex-wrap">
                                  <span className="text-xs text-light/50">{habit.category}</span>
                                  {habit.difficulty && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded capitalize ${difficultyColor}`}>
                                      {habit.difficulty}
                                    </span>
                                  )}
                                  {habit.estimated_duration && (
                                    <span className="text-xs text-light/50">• {habit.estimated_duration}m</span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                  
                  {/* Rest day message if no habits at all */}
                  {timesOfDay.every(time => getHabitsForDayAndTime(day.short, time.name).length === 0) && (
                    <div className="text-center py-6 text-light/30 text-sm">
                      Rest day
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 glass rounded-2xl">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-xl text-light/60 mb-2">No habits yet</p>
          <p className="text-light/40">Create some habits to see your schedule</p>
        </div>
      )}
    </div>
  )
}
