/**
 * Date utilities for calendar navigation and period calculations
 */

export const dateUtils = {
  // Get the start of the week (Sunday)
  getWeekStart: (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day
    return new Date(d.setDate(diff))
  },

  // Get the end of the week (Saturday)
  getWeekEnd: (date) => {
    const weekStart = dateUtils.getWeekStart(date)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    return weekEnd
  },

  // Get all days in a week
  getWeekDays: (date) => {
    const start = dateUtils.getWeekStart(date)
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start)
      day.setDate(start.getDate() + i)
      return day
    })
  },

  // Get the start of the month
  getMonthStart: (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1)
  },

  // Get the end of the month
  getMonthEnd: (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0)
  },

  // Get all days in a month (including padding for calendar grid)
  getMonthDays: (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    // First day of month
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    // Get the Sunday before the first day (for calendar grid)
    const startDate = dateUtils.getWeekStart(firstDay)
    
    // Get the Saturday after the last day
    const endDate = new Date(lastDay)
    endDate.setDate(lastDay.getDate() + (6 - lastDay.getDay()))
    
    const days = []
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      days.push({
        date: new Date(d),
        isCurrentMonth: d.getMonth() === month,
        isToday: dateUtils.isToday(d)
      })
    }
    
    return days
  },

  // Get all months in a year
  getYearMonths: (date) => {
    const year = date.getFullYear()
    return Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(year, i, 1)
      return {
        date: monthDate,
        month: i,
        year: year,
        isCurrentMonth: dateUtils.isCurrentMonth(monthDate)
      }
    })
  },

  // Check if date is today
  isToday: (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  },

  // Check if date is current month
  isCurrentMonth: (date) => {
    const today = new Date()
    return date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear()
  },

  // Check if date is current year
  isCurrentYear: (date) => {
    const today = new Date()
    return date.getFullYear() === today.getFullYear()
  },

  // Check if date is in the future
  isFuture: (date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    return checkDate > today
  },

  // Navigate to next period
  getNextPeriod: (date, view) => {
    const newDate = new Date(date)
    
    switch (view) {
      case 'weekly':
        newDate.setDate(newDate.getDate() + 7)
        break
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + 1)
        break
      case 'yearly':
        newDate.setFullYear(newDate.getFullYear() + 1)
        break
    }
    
    return newDate
  },

  // Navigate to previous period
  getPreviousPeriod: (date, view) => {
    const newDate = new Date(date)
    
    switch (view) {
      case 'weekly':
        newDate.setDate(newDate.getDate() - 7)
        break
      case 'monthly':
        newDate.setMonth(newDate.getMonth() - 1)
        break
      case 'yearly':
        newDate.setFullYear(newDate.getFullYear() - 1)
        break
    }
    
    return newDate
  },

  // Check if can navigate to next period (allow future navigation)
  canNavigateNext: (date, view) => {
    // Always allow navigation to future periods
    return true
  },

  // Format date for display
  formatDate: (date, format = 'short') => {
    switch (format) {
      case 'short':
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      case 'long':
        return date.toLocaleDateString('en-US', { 
          weekday: 'long',
          month: 'long', 
          day: 'numeric',
          year: 'numeric'
        })
      case 'month':
        return date.toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        })
      case 'year':
        return date.getFullYear().toString()
      default:
        return date.toLocaleDateString()
    }
  },

  // Get period display text
  getPeriodDisplay: (date, view) => {
    switch (view) {
      case 'weekly':
        const weekStart = dateUtils.getWeekStart(date)
        const weekEnd = dateUtils.getWeekEnd(date)
        return `${dateUtils.formatDate(weekStart, 'short')} - ${dateUtils.formatDate(weekEnd, 'short')}`
      case 'monthly':
        return dateUtils.formatDate(date, 'month')
      case 'yearly':
        return dateUtils.formatDate(date, 'year')
      default:
        return dateUtils.formatDate(date)
    }
  },

  // Check if two dates are the same day
  isSameDay: (date1, date2) => {
    if (!date1 || !date2) return false
    return date1.toDateString() === date2.toDateString()
  }
}