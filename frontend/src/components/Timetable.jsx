import { useState, useEffect } from 'react'
import { api } from '../services/api'

export default function Timetable({ habits, onNext }) {
  const [isVisible, setIsVisible] = useState(false)
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          loadSchedule()
        }
      },
      { threshold: 0.2 }
    )

    const element = document.getElementById('timetable')
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [])

  const loadSchedule = async () => {
    try {
      setLoading(true)
      const data = await api.getWeeklySchedule()
      setSchedule(data)
    } catch (error) {
      console.error('Failed to load schedule:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSchedule = async () => {
    try {
      setGenerating(true)
      await api.generateTimetable({ user_id: 'default_user' })
      await loadSchedule()
    } catch (error) {
      console.error('Failed to generate schedule:', error)
      
      // Show user-friendly error message
      if (error.response?.status === 400) {
        alert(error.response.data.detail || 'Cannot generate schedule. Please create some "big" habits first.')
      } else {
        alert('Failed to generate schedule. Please try again.')
      }
    } finally {
      setGenerating(false)
    }
  }

  const groupByDay = (items) => {
    const grouped = {}
    days.forEach((_, index) => {
      grouped[index] = []
    })
    
    items?.forEach(item => {
      if (grouped[item.day_of_week]) {
        grouped[item.day_of_week].push(item)
      }
    })
    
    return grouped
  }

  const scheduleByDay = schedule ? groupByDay(schedule.items) : {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-800">Weekly Schedule</h2>
        <p className="text-gray-600 mt-1">Your optimized weekly timetable for big habits</p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <p className="text-sm text-gray-700">
            <strong>Note:</strong> Only "Big" habits with duration tracking are scheduled here. 
            "Atomic" habits are quick checkboxes that don't need time slots.
          </p>
        </div>
      </div>

      {/* Schedule Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
        </div>
      ) : !schedule || !schedule.items || schedule.items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl shadow">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-xl text-gray-600 mb-2">No schedule available</p>
          <p className="text-gray-500">Create some "Big" habits and they'll appear here automatically</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow p-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-gray-800">{schedule.items.length}</div>
              <div className="text-xs text-gray-600">Total Slots</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-gray-800">{Math.round(schedule.total_scheduled_minutes / 60)}h</div>
              <div className="text-xs text-gray-600">Scheduled</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-gray-800">{schedule.conflicts?.length || 0}</div>
              <div className="text-xs text-gray-600">Conflicts</div>
            </div>
          </div>

          {/* Weekly Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {days.map((day, index) => (
              <div key={day} className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold mb-3 text-sm uppercase tracking-wider text-gray-700">{day}</h3>
                <div className="space-y-2">
                  {scheduleByDay[index]?.length > 0 ? (
                    scheduleByDay[index].map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono text-gray-600">
                            {item.start_time.substring(0, 5)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            item.type === 'habit' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {item.type === 'habit' ? '✓' : '📌'}
                          </span>
                        </div>
                        <div className="text-sm font-medium text-gray-800">{item.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{item.category}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No events
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
