/**
 * Example: Monthly Calendar with Daily Success Rate Color Coding
 * 
 * This demonstrates how the monthly calendar component would use
 * the daily success rate data to color-code each day.
 */

import { api } from './src/services/api'

// Example monthly calendar component logic
class MonthlyCalendarWithSuccessRates {
  constructor(year, month) {
    this.year = year
    this.month = month
    this.dailyRates = []
    this.currentDateStats = null
  }

  async loadMonthlyData() {
    try {
      const data = await api.getMonthlySuccessRates(this.year, this.month)
      this.dailyRates = data.daily_rates
      this.currentDateStats = data.current_date_stats
      return data
    } catch (error) {
      console.error('Failed to load monthly success rates:', error)
      return null
    }
  }

  getSuccessRateForDate(dateString) {
    // Check if it's the current date
    if (this.currentDateStats && this.currentDateStats.date === dateString) {
      return {
        success_rate: this.currentDateStats.success_rate,
        total_habit_instances: this.currentDateStats.total_habit_instances,
        completed_instances: this.currentDateStats.completed_instances,
        is_current_date: true
      }
    }

    // Check stored daily rates
    const rate = this.dailyRates.find(r => r.date === dateString)
    if (rate) {
      return {
        success_rate: rate.success_rate,
        total_habit_instances: rate.total_habit_instances,
        completed_instances: rate.completed_instances,
        is_current_date: false
      }
    }

    return null // No data available
  }

  getColorForSuccessRate(successRate) {
    if (successRate === null || successRate === undefined) {
      return 'gray' // No data
    }

    if (successRate >= 80) {
      return 'green' // Good performance
    } else if (successRate >= 50) {
      return 'yellow' // Moderate performance
    } else {
      return 'red' // Poor performance
    }
  }

  getColorClassForDate(dateString) {
    const data = this.getSuccessRateForDate(dateString)
    if (!data) {
      return 'bg-gray-100 text-gray-400' // No data
    }

    const color = this.getColorForSuccessRate(data.success_rate)
    const isCurrentDate = data.is_current_date

    // Base classes for each color
    const colorClasses = {
      green: isCurrentDate 
        ? 'bg-green-200 text-green-800 border-2 border-green-400' // Current date - lighter with border
        : 'bg-green-500 text-white', // Past date - solid color
      yellow: isCurrentDate
        ? 'bg-yellow-200 text-yellow-800 border-2 border-yellow-400'
        : 'bg-yellow-500 text-white',
      red: isCurrentDate
        ? 'bg-red-200 text-red-800 border-2 border-red-400'
        : 'bg-red-500 text-white',
      gray: 'bg-gray-100 text-gray-400'
    }

    return colorClasses[color]
  }

  renderCalendarDay(date, dateString) {
    const data = this.getSuccessRateForDate(dateString)
    const colorClass = this.getColorClassForDate(dateString)
    
    return `
      <div class="calendar-day ${colorClass} p-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity">
        <div class="text-lg font-semibold">${date}</div>
        ${data ? `
          <div class="text-xs mt-1">
            ${data.success_rate.toFixed(0)}%
            <br>
            ${data.completed_instances}/${data.total_habit_instances}
            ${data.is_current_date ? '<br><span class="text-xs opacity-75">Live</span>' : ''}
          </div>
        ` : `
          <div class="text-xs mt-1 opacity-50">
            No data
          </div>
        `}
      </div>
    `
  }
}

// Example usage
async function exampleUsage() {
  const calendar = new MonthlyCalendarWithSuccessRates(2024, 12)
  
  // Load data from backend
  const monthlyData = await calendar.loadMonthlyData()
  
  if (monthlyData) {
    console.log('📅 Monthly Success Rate Data:')
    console.log(`Year: ${monthlyData.year}, Month: ${monthlyData.month}`)
    
    // Example: Render a few days
    const exampleDates = [
      { date: 1, dateString: '2024-12-01' },
      { date: 5, dateString: '2024-12-05' },
      { date: 9, dateString: '2024-12-09' }, // Current date
      { date: 15, dateString: '2024-12-15' }, // Future date
    ]
    
    exampleDates.forEach(({ date, dateString }) => {
      const data = calendar.getSuccessRateForDate(dateString)
      const color = calendar.getColorForSuccessRate(data?.success_rate)
      
      console.log(`📊 ${dateString}: ${data ? `${data.success_rate}% (${color})` : 'No data (gray)'}`)
    })
  }
}

// Color coding reference
const COLOR_CODING_REFERENCE = {
  red: {
    range: '0-49%',
    description: 'Poor performance, needs attention',
    example: 'Only completed 2 out of 8 habits'
  },
  yellow: {
    range: '50-79%',
    description: 'Moderate performance, room for improvement', 
    example: 'Completed 5 out of 8 habits'
  },
  green: {
    range: '80-100%',
    description: 'Good performance, keep it up!',
    example: 'Completed 7 out of 8 habits'
  },
  gray: {
    range: 'N/A',
    description: 'No data available',
    example: 'Future dates or days with no habits scheduled'
  }
}

export { MonthlyCalendarWithSuccessRates, COLOR_CODING_REFERENCE }