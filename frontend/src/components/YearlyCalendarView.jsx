import { dateUtils } from '../utils/dateUtils'

export default function YearlyCalendarView({ 
  habits, 
  completions = [], 
  viewDate,
  journeyStartDate,
  onMonthClick 
}) {
  const yearMonths = dateUtils.getYearMonths(viewDate)

  // Check if a month should be disabled (before journey start)
  const isMonthDisabled = (monthInfo) => {
    if (!journeyStartDate) return false
    
    const monthDate = new Date(monthInfo.year, monthInfo.month, 1)
    const journeyMonthStart = dateUtils.getMonthStart(journeyStartDate)
    
    return monthDate < journeyMonthStart
  }

  // Check if this is the journey start month
  const isJourneyStartMonth = (monthInfo) => {
    if (!journeyStartDate) return false
    
    const monthDate = new Date(monthInfo.year, monthInfo.month, 1)
    const journeyMonthStart = dateUtils.getMonthStart(journeyStartDate)
    
    return monthDate.getTime() === journeyMonthStart.getTime()
  }
  
  const getMonthCompletionRate = (month, year) => {
    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0)
    const days = (monthEnd - monthStart) / (1000 * 60 * 60 * 24) + 1
    
    let totalPossible = habits.length * days
    let totalCompleted = 0
    
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      habits.forEach(habit => {
        const dateStr = d.toISOString().split('T')[0]
        const isCompleted = completions.some(c => 
          c.habit_id === habit.id && 
          c.completion_date?.split('T')[0] === dateStr &&
          c.completed
        )
        if (isCompleted) totalCompleted++
      })
    }
    
    return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0
  }

  const getMonthStatus = (monthInfo) => {
    const rate = getMonthCompletionRate(monthInfo.month, monthInfo.year)
    const isFuture = monthInfo.date > new Date()
    
    if (isFuture) return 'future'
    if (rate >= 80) return 'excellent'
    if (rate >= 60) return 'good'
    if (rate >= 40) return 'fair'
    if (rate > 0) return 'poor'
    return 'none'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-500/20 border-green-500/30 text-green-300'
      case 'good':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-300'
      case 'fair':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300'
      case 'poor':
        return 'bg-orange-500/20 border-orange-500/30 text-orange-300'
      case 'none':
        return 'bg-red-500/20 border-red-500/30 text-red-300'
      case 'future':
        return 'bg-light/5 text-light/40'
      default:
        return 'bg-light/5 text-light/60'
    }
  }

  const getStatusLabel = (status, rate) => {
    switch (status) {
      case 'excellent':
        return 'Excellent'
      case 'good':
        return 'Good'
      case 'fair':
        return 'Fair'
      case 'poor':
        return 'Needs Work'
      case 'none':
        return 'No Progress'
      case 'future':
        return 'Upcoming'
      default:
        return `${rate}%`
    }
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="space-y-6">
        {/* Year overview stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-light/10">
          <div className="text-center">
            <div className="text-2xl font-bold text-light">
              {yearMonths.filter(m => getMonthStatus(m) === 'excellent').length}
            </div>
            <div className="text-xs text-light/60">Excellent Months</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-light">
              {Math.round(yearMonths.reduce((sum, m) => 
                sum + getMonthCompletionRate(m.month, m.year), 0) / 12)}%
            </div>
            <div className="text-xs text-light/60">Average Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-light">
              {completions.length}
            </div>
            <div className="text-xs text-light/60">Total Completions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-light">
              {habits.length}
            </div>
            <div className="text-xs text-light/60">Active Habits</div>
          </div>
        </div>

        {/* Monthly grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {yearMonths.map((monthInfo) => {
            const completionRate = getMonthCompletionRate(monthInfo.month, monthInfo.year)
            const status = getMonthStatus(monthInfo)
            const monthName = monthInfo.date.toLocaleDateString('en-US', { month: 'short' })
            const disabled = isMonthDisabled(monthInfo)
            const isJourneyStart = isJourneyStartMonth(monthInfo)
            
            return (
              <div 
                key={monthInfo.month} 
                className={`
                  p-4 rounded-lg transition-all 
                  ${disabled 
                    ? 'opacity-30 cursor-not-allowed' 
                    : 'cursor-pointer hover:scale-105'
                  }
                  ${monthInfo.isCurrentMonth ? 'border-2 border-light ring-2 ring-light/30 bg-light/10' : ''}
                  ${getStatusColor(status)}
                `}
                onClick={() => !disabled && onMonthClick && onMonthClick(monthInfo.date)}
              >
                {/* Month header */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`text-sm font-medium ${
                    monthInfo.isCurrentMonth ? 'text-light font-bold text-base' : 'text-current'
                  }`}>
                    {monthName}
                  </div>
                  {monthInfo.isCurrentMonth && (
                    <div className="w-3 h-3 bg-light rounded-full shadow-lg"></div>
                  )}

                </div>
                
                {/* Completion rate */}
                <div className="mb-3">
                  <div className="text-2xl font-bold text-current mb-1">
                    {status === 'future' ? '—' : `${completionRate}%`}
                  </div>
                  <div className="text-xs text-current/80">
                    {getStatusLabel(status, completionRate)}
                  </div>
                </div>
                
                {/* Progress bar */}
                {status !== 'future' && (
                  <div className="relative">
                    <div className="w-full bg-current/20 rounded-full h-2 mb-2">
                      <div 
                        className="h-2 rounded-full bg-current transition-all"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    
                    {/* Mini calendar dots for weeks */}
                    <div className="grid grid-cols-4 gap-1">
                      {Array.from({ length: 4 }, (_, weekIndex) => {
                        // Simplified week completion (you could make this more accurate)
                        const weekRate = Math.max(0, completionRate - (weekIndex * 25))
                        return (
                          <div
                            key={weekIndex}
                            className={`h-1 rounded-full ${
                              weekRate > 0 ? 'bg-current/60' : 'bg-current/20'
                            }`}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
                
                {/* Future month indicator */}
                {status === 'future' && (
                  <div className="text-xs text-current/60">
                    Starts in {Math.ceil((monthInfo.date - new Date()) / (1000 * 60 * 60 * 24))} days
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-6 border-t border-light/10">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30"></div>
            <span className="text-light/60">Excellent (80%+)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/30"></div>
            <span className="text-light/60">Good (60-79%)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/30"></div>
            <span className="text-light/60">Fair (40-59%)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-orange-500/20 border border-orange-500/30"></div>
            <span className="text-light/60">Poor (1-39%)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/30"></div>
            <span className="text-light/60">None (0%)</span>
          </div>
        </div>
      </div>
    </div>
  )
}