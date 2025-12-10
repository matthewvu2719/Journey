import { useState } from 'react'
import WeeklyScheduleView from './WeeklyScheduleView'

export default function EnhancedSchedule({ habits = [], completions = [] }) {
  const [view, setView] = useState('weekly')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  const views = [
    { id: 'weekly', label: 'Weekly', icon: '📅' },
    { id: 'monthly', label: 'Monthly', icon: '📆' },
    { id: 'yearly', label: 'Yearly', icon: '🗓️' }
  ]

  const timesOfDay = [
    { id: 1, name: 'morning', label: 'Morning', icon: '🌅' },
    { id: 2, name: 'noon', label: 'Noon', icon: '☀️' },
    { id: 3, name: 'afternoon', label: 'Afternoon', icon: '🌤️' },
    { id: 4, name: 'night', label: 'Night', icon: '🌙' }
  ]

  const getWeekStart = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  }

  const getWeekDays = (date) => {
    const start = getWeekStart(date)
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      return day
    })
  }

  const getMonthDays = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days = []
    
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d))
    }
    return days
  }

  const isCompleted = (habitId, date) => {
    const dateStr = date.toISOString().split('T')[0]
    return completions.some(c => 
      c.habit_id === habitId && 
      c.completion_date?.split('T')[0] === dateStr &&
      c.completed
    )
  }

  const getMonthCompletionRate = (month, year) => {
    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0)
    const days = (monthEnd - monthStart) / (1000 * 60 * 60 * 24) + 1
    
    let totalPossible = habits.length * days
    let totalCompleted = 0
    
    for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
      habits.forEach(habit => {
        if (isCompleted(habit.id, d)) totalCompleted++
      })
    }
    
    return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0
  }

  const minSwipeDistance = 50

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      navigateNext()
    }
    if (isRightSwipe) {
      navigatePrevious()
    }
  }

  const navigatePrevious = () => {
    if (view === 'weekly') {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() - 7)
      
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      if (newDate >= firstDayOfMonth) {
        setCurrentDate(newDate)
      }
    } else if (view === 'monthly') {
      const newDate = new Date(currentDate)
      newDate.setMonth(newDate.getMonth() - 1)
      setCurrentDate(newDate)
    } else if (view === 'yearly') {
      const newDate = new Date(currentDate)
      newDate.setFullYear(newDate.getFullYear() - 1)
      setCurrentDate(newDate)
    }
  }

  const navigateNext = () => {
    const today = new Date()
    
    if (view === 'weekly') {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + 7)
      
      if (getWeekStart(newDate) <= getWeekStart(today)) {
        setCurrentDate(newDate)
      }
    } else if (view === 'monthly') {
      const newDate = new Date(currentDate)
      newDate.setMonth(newDate.getMonth() + 1)
      
      if (newDate.getMonth() <= today.getMonth() && newDate.getFullYear() <= today.getFullYear()) {
        setCurrentDate(newDate)
      }
    } else if (view === 'yearly') {
      const newDate = new Date(currentDate)
      newDate.setFullYear(newDate.getFullYear() + 1)
      
      if (newDate.getFullYear() <= today.getFullYear()) {
        setCurrentDate(newDate)
      }
    }
  }

  const canNavigatePrevious = () => {
    if (view === 'weekly') {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() - 7)
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      return newDate >= firstDayOfMonth
    }
    return true
  }

  const canNavigateNext = () => {
    const today = new Date()
    
    if (view === 'weekly') {
      const newDate = new Date(currentDate)
      newDate.setDate(newDate.getDate() + 7)
      return getWeekStart(newDate) <= getWeekStart(today)
    } else if (view === 'monthly') {
      const newDate = new Date(currentDate)
      newDate.setMonth(newDate.getMonth() + 1)
      return newDate.getMonth() <= today.getMonth() && newDate.getFullYear() <= today.getFullYear()
    } else if (view === 'yearly') {
      const newDate = new Date(currentDate)
      newDate.setFullYear(newDate.getFullYear() + 1)
      return newDate.getFullYear() <= today.getFullYear()
    }
    return false
  }

  const renderWeeklyView = () => {
    return <WeeklyScheduleView habits={habits} completions={completions} currentDate={currentDate} />
  }

  const renderMonthlyView = () => {
    const monthDays = getMonthDays(currentDate)
    
    return (
      <div className="glass rounded-2xl p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-light/60">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {monthDays.map((day, idx) => (
              <div key={idx} className="bg-light/5 rounded-lg p-2 min-h-[100px]">
                <div className="text-xs font-bold mb-1 text-light">{day.getDate()}</div>
                <div className="space-y-1">
                  {habits.map(habit => (
                    <div
                      key={habit.id}
                      className={`text-xs px-1 py-0.5 rounded truncate ${
                        isCompleted(habit.id, day)
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                      title={habit.name}
                    >
                      {habit.name}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderYearlyView = () => {
    const year = currentDate.getFullYear()
    const months = Array.from({ length: 12 }, (_, i) => i)
    
    return (
      <div className="glass rounded-2xl p-6">
        <div className="grid grid-cols-3 gap-4">
          {months.map(month => {
            const completionRate = getMonthCompletionRate(month, year)
            const monthName = new Date(year, month, 1).toLocaleDateString('en-US', { month: 'short' })
            
            return (
              <div key={month} className="bg-light/5 rounded-lg p-4">
                <div className="text-sm font-medium mb-2 text-light">{monthName}</div>
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block text-light">
                        {completionRate}%
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-light/10">
                    <div
                      style={{ width: `${completionRate}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-light"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-light">Schedule</h2>
        
        <select
          value={view}
          onChange={(e) => setView(e.target.value)}
          className="px-4 py-2 glass border border-light/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-light"
        >
          {views.map(v => (
            <option key={v.id} value={v.id}>
              {v.icon} {v.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={navigatePrevious}
          disabled={!canNavigatePrevious()}
          className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-background)] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          ← Previous
        </button>
        
        <div className="text-lg font-semibold text-light">
          {view === 'weekly' && `Week of ${getWeekStart(currentDate).toLocaleDateString()}`}
          {view === 'monthly' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          {view === 'yearly' && currentDate.getFullYear()}
        </div>
        
        <button
          onClick={navigateNext}
          disabled={!canNavigateNext()}
          className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-background)] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          Next →
        </button>
      </div>

      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="touch-pan-y"
      >
        {view === 'weekly' && renderWeeklyView()}
        {view === 'monthly' && renderMonthlyView()}
        {view === 'yearly' && renderYearlyView()}
      </div>
    </div>
  )
}
