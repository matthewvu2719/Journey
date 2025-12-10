import { useState, useEffect } from 'react'
import { dateUtils } from '../utils/dateUtils'
import { api } from '../services/api'

export default function MonthlyCalendarView({ 
  habits, 
  completions = [], 
  viewDate,
  onDateClick 
}) {
  const [successRates, setSuccessRates] = useState({})
  const [loading, setLoading] = useState(true)
  const monthDays = dateUtils.getMonthDays(viewDate)

  // Load success rates for the month
  useEffect(() => {
    loadSuccessRates()
  }, [viewDate])

  const loadSuccessRates = async () => {
    try {
      setLoading(true)
      
      // Get first and last day of the month
      const firstDay = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
      const lastDay = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
      
      const startDate = firstDay.toISOString().split('T')[0]
      const endDate = lastDay.toISOString().split('T')[0]
      
      const response = await api.getSuccessRatesRange(startDate, endDate)
      
      // Convert array to map for easy lookup
      const ratesMap = {}
      response.rates.forEach(rate => {
        ratesMap[rate.date] = rate
      })
      
      setSuccessRates(ratesMap)
    } catch (error) {
      console.error('Failed to load success rates:', error)
      // Fallback to old calculation method
      setSuccessRates({})
    } finally {
      setLoading(false)
    }
  }
  
  const isCompleted = (habitId, date) => {
    const dateStr = date.toISOString().split('T')[0]
    return completions.some(c => 
      c.habit_id === habitId && 
      c.completion_date?.split('T')[0] === dateStr &&
      c.completed
    )
  }

  const getDayCompletionRate = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    const successRate = successRates[dateStr]
    
    if (successRate) {
      return successRate.success_rate
    }
    
    // Fallback to old calculation if no success rate data
    if (habits.length === 0) return 0
    
    const completedCount = habits.filter(habit => 
      isCompleted(habit.id, date)
    ).length
    
    return Math.round((completedCount / habits.length) * 100)
  }

  const getDayCompletionStatus = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    const successRate = successRates[dateStr]
    
    if (successRate) {
      return successRate.status
    }
    
    // Fallback to old calculation
    const rate = getDayCompletionRate(date)
    if (rate >= 80) return 'green'
    if (rate > 0) return 'yellow'
    if (dateUtils.isFuture(date)) return 'gray'
    return 'red'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'green':
        return 'bg-green-500/20 border-green-500/30 text-green-300'
      case 'yellow':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
      case 'red':
        return 'bg-red-500/20 border-red-500/30 text-red-300'
      case 'gray':
        return 'bg-light/5 text-light/40'
      default:
        return 'bg-light/5 text-light/60'
    }
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-light"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="space-y-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-light/60 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">
          {monthDays.map((dayInfo, idx) => {
            const { date, isCurrentMonth, isToday } = dayInfo
            const completionStatus = getDayCompletionStatus(date)
            const completionRate = getDayCompletionRate(date)
            
            return (
              <div 
                key={idx} 
                className={`
                  relative min-h-[80px] p-2 rounded-lg transition-all cursor-pointer hover:scale-105
                  ${isCurrentMonth ? 'bg-light/5' : 'bg-light/2'}
                  ${isToday ? 'border-2 border-light ring-2 ring-light/20' : ''}
                  ${getStatusColor(completionStatus)}
                `}
                onClick={() => onDateClick && onDateClick(date)}
              >
                {/* Date number */}
                <div className={`text-sm font-bold mb-1 ${
                  isToday ? 'text-light' : 
                  isCurrentMonth ? 'text-light' : 'text-light/30'
                }`}>
                  {date.getDate()}
                </div>
                
                {/* Today indicator */}
                {isToday && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-light rounded-full"></div>
                )}
                
                {/* Completion indicator */}
                {isCurrentMonth && habits.length > 0 && !dateUtils.isFuture(date) && (
                  <div className="space-y-1">
                    {/* Completion rate */}
                    <div className="text-xs font-semibold">
                      {completionRate}%
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-light/10 rounded-full h-1">
                      <div 
                        className="h-1 rounded-full bg-current transition-all"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    
                    {/* Habit dots */}
                    <div className="flex flex-wrap gap-0.5">
                      {habits.slice(0, 6).map(habit => (
                        <div
                          key={habit.id}
                          className={`w-1.5 h-1.5 rounded-full ${
                            isCompleted(habit.id, date) 
                              ? 'bg-green-400' 
                              : 'bg-light/20'
                          }`}
                          title={habit.name}
                        />
                      ))}
                      {habits.length > 6 && (
                        <div className="text-xs text-light/40">
                          +{habits.length - 6}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Future date indicator */}
                {dateUtils.isFuture(date) && isCurrentMonth && (
                  <div className="text-xs text-light/30 mt-2">
                    Upcoming
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-light/10">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30"></div>
            <span className="text-light/60">80-100%</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/30"></div>
            <span className="text-light/60">1-79%</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30"></div>
            <span className="text-light/60">0%</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-light/5"></div>
            <span className="text-light/60">Future</span>
          </div>
        </div>
      </div>
    </div>
  )
}