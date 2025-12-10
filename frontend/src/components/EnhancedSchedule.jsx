import { useState, useEffect } from 'react'
import WeeklyCalendarView from './WeeklyCalendarView'
import MonthlyCalendarView from './MonthlyCalendarView'
import YearlyCalendarView from './YearlyCalendarView'
import { dateUtils } from '../utils/dateUtils'

export default function EnhancedSchedule({ habits = [], completions = [] }) {
  const [view, setView] = useState('weekly')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewDate, setViewDate] = useState(new Date()) // What period user is viewing
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  const views = [
    { id: 'weekly', label: 'Weekly', icon: '📅' },
    { id: 'monthly', label: 'Monthly', icon: '📆' },
    { id: 'yearly', label: 'Yearly', icon: '🗓️' }
  ]

  // Auto-advance logic - check for date changes
  useEffect(() => {
    const checkDateChange = () => {
      const now = new Date()
      if (now.getDate() !== currentDate.getDate()) {
        setCurrentDate(now)
        // Auto-advance to current period if user was viewing current period
        if (isViewingCurrentPeriod()) {
          setViewDate(now)
        }
      }
    }
    
    // Check every hour for date changes
    const interval = setInterval(checkDateChange, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [currentDate])

  // Check if user is viewing the current period
  const isViewingCurrentPeriod = () => {
    const today = new Date()
    
    switch (view) {
      case 'weekly':
        return dateUtils.getWeekStart(viewDate).getTime() === dateUtils.getWeekStart(today).getTime()
      case 'monthly':
        return dateUtils.isCurrentMonth(viewDate)
      case 'yearly':
        return dateUtils.isCurrentYear(viewDate)
      default:
        return false
    }
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
    const newDate = dateUtils.getPreviousPeriod(viewDate, view)
    setViewDate(newDate)
  }

  const navigateNext = () => {
    const newDate = dateUtils.getNextPeriod(viewDate, view)
    if (dateUtils.canNavigateNext(viewDate, view)) {
      setViewDate(newDate)
    }
  }

  const navigateToToday = () => {
    const today = new Date()
    setViewDate(today)
  }

  const canNavigatePrevious = () => {
    // Allow navigation to any past period
    return true
  }

  const canNavigateNext = () => {
    return dateUtils.canNavigateNext(viewDate, view)
  }

  const handleDateClick = (date) => {
    // Navigate to weekly view and show the week containing the clicked date
    setView('weekly')
    setViewDate(new Date(date))
  }

  const handleMonthClick = (monthDate) => {
    // Navigate to monthly view for the clicked month
    setView('monthly')
    setViewDate(monthDate)
  }

  const renderWeeklyView = () => {
    return (
      <WeeklyCalendarView 
        habits={habits} 
        completions={completions} 
        viewDate={viewDate}
        onDateClick={handleDateClick}
      />
    )
  }

  const renderMonthlyView = () => {
    return (
      <MonthlyCalendarView 
        habits={habits} 
        completions={completions} 
        viewDate={viewDate}
        onDateClick={handleDateClick}
      />
    )
  }

  const renderYearlyView = () => {
    return (
      <YearlyCalendarView 
        habits={habits} 
        completions={completions} 
        viewDate={viewDate}
        onMonthClick={handleMonthClick}
      />
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
        
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold text-light">
            {dateUtils.getPeriodDisplay(viewDate, view)}
          </div>
          {!isViewingCurrentPeriod() && (
            <button
              onClick={navigateToToday}
              className="px-3 py-1 bg-light text-dark rounded-lg text-sm font-medium hover:bg-light/90 transition-colors"
            >
              Today
            </button>
          )}
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
