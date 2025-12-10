import { dateUtils } from '../utils/dateUtils'

export default function WeeklyCalendarView({ 
  habits, 
  completions = [], 
  viewDate,
  onDateClick 
}) {
  const days = [
    { full: 'Sunday', short: 'Sun' },
    { full: 'Monday', short: 'Mon' },
    { full: 'Tuesday', short: 'Tue' },
    { full: 'Wednesday', short: 'Wed' },
    { full: 'Thursday', short: 'Thu' },
    { full: 'Friday', short: 'Fri' },
    { full: 'Saturday', short: 'Sat' }
  ]

  const timesOfDay = [
    { id: 1, name: 'morning', label: 'Morning', icon: '🌅' },
    { id: 2, name: 'noon', label: 'Noon', icon: '☀️' },
    { id: 3, name: 'afternoon', label: 'Afternoon', icon: '🌤️' },
    { id: 4, name: 'night', label: 'Night', icon: '🌙' }
  ]

  const weekDays = dateUtils.getWeekDays(viewDate)

  const getDateForDay = (dayIndex) => {
    return weekDays[dayIndex]
  }
  
  const isInstanceCompleted = (habitId, dayIndex, timeOfDayId) => {
    const date = getDateForDay(dayIndex)
    const dateStr = date.toISOString().split('T')[0]
    
    return completions.some(c => 
      c.habit_id === habitId && 
      c.completed_date === dateStr &&
      c.time_of_day_id === timeOfDayId
    )
  }

  const isOverdue = (habit, dayIndex, timeOfDayId) => {
    const date = getDateForDay(dayIndex)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    
    const isPast = date < today
    const completed = isInstanceCompleted(habit.id, dayIndex, timeOfDayId)
    
    const habitCreatedDate = habit.created_at ? new Date(habit.created_at.split('T')[0]) : null
    const isAfterCreation = !habitCreatedDate || date >= habitCreatedDate
    
    return isPast && !completed && isAfterCreation
  }

  const getHabitsForDayAndTime = (dayShort, timeName) => {
    return habits.filter(habit => {
      const hasDay = habit.days && habit.days.includes(dayShort)
      const hasTime = habit.times_of_day && habit.times_of_day.includes(timeName)
      return hasDay && hasTime
    }).sort((a, b) => (b.priority || 5) - (a.priority || 5))
  }

  return (
    <div className="space-y-6">
      {habits.length > 0 ? (
        <div className="glass rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4">
            {days.map((day, dayIndex) => {
              const dayDate = weekDays[dayIndex]
              const isToday = dateUtils.isToday(dayDate)
              
              return (
                <div 
                  key={day.short} 
                  className={`bg-light/5 rounded-xl p-4 transition-all cursor-pointer hover:bg-light/10 ${
                    isToday ? 'border-2 border-light ring-2 ring-light/20' : ''
                  }`}
                  onClick={() => onDateClick && onDateClick(dayDate)}
                >
                  <div className="flex flex-col items-center mb-3">
                    <h4 className={`font-bold text-sm uppercase tracking-wider mb-1 ${
                      isToday ? 'text-light' : 'text-light/80'
                    }`}>
                      {day.full}
                    </h4>
                    <div className={`text-xs ${
                      isToday ? 'text-light font-bold' : 'text-light/60'
                    }`}>
                      {dayDate.getDate()}
                    </div>
                    {isToday && (
                      <div className="w-2 h-2 bg-light rounded-full mt-1"></div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    {timesOfDay.map((time) => {
                      const timeHabits = getHabitsForDayAndTime(day.short, time.name)
                      
                      if (timeHabits.length === 0) return null
                      
                      return (
                        <div key={time.id} className="space-y-1">
                          <div className="text-xs font-semibold text-light/60 uppercase tracking-wide flex items-center gap-1">
                            <span>{time.icon}</span>
                            <span>{time.label}</span>
                          </div>
                          
                          <div className="space-y-1">
                            {timeHabits.map(habit => {
                              const isCompleted = isInstanceCompleted(habit.id, dayIndex, time.id)
                              const isPastDue = isOverdue(habit, dayIndex, time.id)
                              const difficultyColors = {
                                easy: 'bg-green-500/20 text-green-300',
                                medium: 'bg-yellow-500/20 text-yellow-300',
                                hard: 'bg-red-500/20 text-red-300'
                              }
                              const difficultyColor = difficultyColors[habit.difficulty] || difficultyColors.medium
                              
                              let cardStyle = 'bg-light/10'
                              if (isCompleted) {
                                cardStyle = 'bg-green-500/20 border border-green-500/30'
                              } else if (isPastDue) {
                                cardStyle = 'bg-red-500/20 border border-red-500/30'
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
                    
                    {timesOfDay.every(time => getHabitsForDayAndTime(day.short, time.name).length === 0) && (
                      <div className="text-center py-6 text-light/30 text-sm">
                        Rest day
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
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