import { useState, useEffect } from 'react'
import WeeklyCalendarView from './WeeklyCalendarView'
import MonthlyCalendarView from './MonthlyCalendarView'
import YearlyCalendarView from './YearlyCalendarView'
import { dateUtils } from '../utils/dateUtils'
import { api } from '../services/api'

export default function EnhancedSchedule({ habits = [], completions = [], onSectionChange, onRefresh }) {
  const [view, setView] = useState('weekly')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewDate, setViewDate] = useState(new Date()) // What period user is viewing
  const [selectedDate, setSelectedDate] = useState(null) // Date selected from monthly calendar
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const views = [
    { id: 'weekly', label: 'Weekly', icon: '📅' },
    { id: 'monthly', label: 'Monthly', icon: '📆' },
    { id: 'yearly', label: 'Yearly', icon: '🗓️' }
  ]

  // Calculate the user's habit journey start date
  const getJourneyStartDate = () => {
    if (!habits || habits.length === 0) {
      return new Date() // If no habits, use today as start
    }
    
    const earliestHabit = habits.reduce((earliest, habit) => {
      if (!habit.created_at) return earliest
      const habitDate = new Date(habit.created_at)
      return !earliest || habitDate < earliest ? habitDate : earliest
    }, null)
    
    return earliestHabit || new Date()
  }

  const journeyStartDate = getJourneyStartDate()

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

  // Expose reset function for parent component
  useEffect(() => {
    if (onSectionChange) {
      onSectionChange(() => {
        setSelectedDate(null) // Reset selected date when section changes
      })
    }
  }, [onSectionChange])

  // Check if user is viewing the current period (current date is visible in the view)
  // This is independent of selectedDate - only depends on viewDate
  const isViewingCurrentPeriod = () => {
    const today = new Date()
    
    switch (view) {
      case 'weekly':
        // More robust week comparison - check if today falls within the viewed week
        const todayTime = today.getTime()
        const viewWeekStart = dateUtils.getWeekStart(new Date(viewDate))
        const viewWeekEnd = dateUtils.getWeekEnd(new Date(viewDate))
        
        // Normalize times to avoid hour/minute/second differences
        viewWeekStart.setHours(0, 0, 0, 0)
        viewWeekEnd.setHours(23, 59, 59, 999)
        
        const isInCurrentWeek = todayTime >= viewWeekStart.getTime() && todayTime <= viewWeekEnd.getTime()
        
        console.log('[DEBUG] Weekly Current Check:', {
          today: today.toDateString(),
          viewDate: viewDate.toDateString(),
          viewWeekStart: viewWeekStart.toDateString(),
          viewWeekEnd: viewWeekEnd.toDateString(),
          isInCurrentWeek
        })
        
        return isInCurrentWeek
      case 'monthly':
        // Check if today falls within the currently viewed month
        return dateUtils.isCurrentMonth(viewDate)
      case 'yearly':
        // Check if today falls within the currently viewed year
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
    if (canNavigatePrevious()) {
      const newDate = dateUtils.getPreviousPeriod(viewDate, view)
      setViewDate(newDate)
    }
  }

  const navigateNext = () => {
    const newDate = dateUtils.getNextPeriod(viewDate, view)
    if (dateUtils.canNavigateNext(viewDate, view)) {
      setViewDate(newDate)
    }
  }

  const navigateToCurrent = () => {
    const today = new Date()
    setViewDate(today)
    setSelectedDate(null) // Reset selected date to show current date highlighting
  }

  const canNavigatePrevious = () => {
    if (!journeyStartDate) return true
    
    const previousPeriod = dateUtils.getPreviousPeriod(viewDate, view)
    
    switch (view) {
      case 'weekly':
        const journeyWeekStart = dateUtils.getWeekStart(journeyStartDate)
        const previousWeekStart = dateUtils.getWeekStart(previousPeriod)
        
        // Normalize dates to avoid timezone issues
        journeyWeekStart.setHours(0, 0, 0, 0)
        previousWeekStart.setHours(0, 0, 0, 0)
        
        // Allow navigation if the previous week is at or after the journey start week
        return previousWeekStart.getTime() >= journeyWeekStart.getTime()
        
      case 'monthly':
        const journeyMonthStart = dateUtils.getMonthStart(journeyStartDate)
        const previousMonthStart = dateUtils.getMonthStart(previousPeriod)
        // Allow navigation if the previous month is at or after the journey start month
        return previousMonthStart.getTime() >= journeyMonthStart.getTime()
        
      case 'yearly':
        return previousPeriod.getFullYear() >= journeyStartDate.getFullYear()
        
      default:
        return true
    }
  }

  const canNavigateNext = () => {
    return dateUtils.canNavigateNext(viewDate, view)
  }

  const handleDateClick = (date) => {
    // Navigate to weekly view and show the week containing the clicked date
    setView('weekly')
    setViewDate(new Date(date))
    setSelectedDate(new Date(date)) // Set the selected date for highlighting
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
        selectedDate={selectedDate}
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
        journeyStartDate={journeyStartDate}
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
        journeyStartDate={journeyStartDate}
        onMonthClick={handleMonthClick}
      />
    )
  }

  const handleRefreshSchedule = async () => {
    setIsRefreshing(true)
    try {
      // If parent provides refresh function, use it
      if (onRefresh) {
        await onRefresh()
      } else {
        // Fallback: refresh data directly
        const today = new Date()
        const dayOfWeek = today.getDay()
        const monday = new Date(today)
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
        const startDate = monday.toISOString().split('T')[0]
        
        await api.getCompletions({ start_date: startDate })
      }
      
      // Show success feedback briefly
      setTimeout(() => {
        setIsRefreshing(false)
      }, 500)
    } catch (error) {
      console.error('Failed to refresh schedule:', error)
      setIsRefreshing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold text-light">Schedule</h2>
          <button
            onClick={handleRefreshSchedule}
            disabled={isRefreshing}
            className="p-2 rounded-lg hover:bg-light/10 transition-colors disabled:opacity-50"
            title="Refresh schedule data"
          >
            <svg 
              className={`w-5 h-5 text-light/60 ${isRefreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
              />
            </svg>
          </button>
        </div>
        
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
          {(() => {
            const isCurrentPeriod = isViewingCurrentPeriod()
            console.log('[DEBUG] Button Render:', {
              view,
              isCurrentPeriod,
              shouldShowButton: !isCurrentPeriod
            })
            return !isCurrentPeriod && (
              <button
                onClick={navigateToCurrent}
                className="px-3 py-1 bg-light text-dark rounded-lg text-sm font-medium hover:bg-light/90 transition-colors"
              >
                Current
              </button>
            )
          })()}
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
