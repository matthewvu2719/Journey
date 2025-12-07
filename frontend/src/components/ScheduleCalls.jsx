import { useState, useEffect } from 'react'
import { api } from '../services/api'

export default function ScheduleCalls() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [callTime, setCallTime] = useState('09:00')
  const [timezone, setTimezone] = useState('UTC')
  const [enabled, setEnabled] = useState(true)
  const [callHistory, setCallHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    loadCallSchedule()
    loadCallHistory()
  }, [])

  const loadCallSchedule = async () => {
    try {
      const schedule = await api.getCallSchedule()
      if (schedule) {
        setPhoneNumber(schedule.phone_number || '')
        setCallTime(schedule.preferred_time || '09:00')
        setTimezone(schedule.timezone || 'UTC')
        setEnabled(schedule.enabled || false)
      }
    } catch (error) {
      // Silently handle - voice API not yet implemented
      if (error.response?.status !== 404) {
        console.error('Failed to load call schedule:', error)
      }
    }
  }

  const loadCallHistory = async () => {
    try {
      const history = await api.getCallHistory()
      setCallHistory(history || [])
    } catch (error) {
      // Silently handle - voice API not yet implemented
      if (error.response?.status !== 404) {
        console.error('Failed to load call history:', error)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      await api.scheduleCall({
        phone_number: phoneNumber,
        preferred_time: callTime,
        timezone: timezone,
        enabled: enabled
      })
      setMessage({ type: 'success', text: 'Call schedule saved successfully!' })
      loadCallSchedule()
    } catch (error) {
      const errorMsg = error.response?.status === 404 
        ? 'Voice calling feature is not yet available on the backend.'
        : 'Failed to save schedule. Please try again.'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  const handleTestCall = async () => {
    setLoading(true)
    setMessage(null)

    try {
      await api.testCall({ phone_number: phoneNumber })
      setMessage({ type: 'success', text: 'Test call initiated! You should receive a call shortly.' })
      setTimeout(loadCallHistory, 2000)
    } catch (error) {
      const errorMsg = error.response?.status === 404 
        ? 'Voice calling feature is not yet available on the backend.'
        : 'Failed to initiate test call.'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-light">AI Voice Call Schedule</h2>
        <p className="text-light/60 mt-1">Set up automated check-in calls from your AI habit coach</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Schedule Form */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-bold text-light mb-4">Call Settings</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-light/80 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-4 py-2 bg-light/10 border border-light/20 rounded-lg focus:ring-2 focus:ring-light/40 focus:border-transparent text-light placeholder-light/40"
                required
              />
              <p className="text-xs text-light/50 mt-1">Include country code (e.g., +1 for US)</p>
            </div>

            {/* Call Time */}
            <div>
              <label className="block text-sm font-semibold text-light/80 mb-2">
                Preferred Call Time
              </label>
              <input
                type="time"
                value={callTime}
                onChange={(e) => setCallTime(e.target.value)}
                className="w-full px-4 py-2 bg-light/10 border border-light/20 rounded-lg focus:ring-2 focus:ring-light/40 focus:border-transparent text-light"
                required
              />
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-semibold text-light/80 mb-2">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-2 bg-light/10 border border-light/20 rounded-lg focus:ring-2 focus:ring-light/40 focus:border-transparent text-light"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>

            {/* Enable/Disable */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="enabled"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 text-light border-light/20 rounded focus:ring-light/40"
              />
              <label htmlFor="enabled" className="ml-2 text-sm text-light/80">
                Enable daily check-in calls
              </label>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-3 rounded-lg ${
                message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message.text}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-light text-dark rounded-lg hover:bg-light/90 transition font-semibold disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Schedule'}
              </button>
              <button
                type="button"
                onClick={handleTestCall}
                disabled={loading || !phoneNumber}
                className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold disabled:opacity-50"
              >
                Test Call
              </button>
            </div>
          </form>
        </div>

        {/* Info & Call History */}
        <div className="space-y-6">
          {/* How It Works */}
          <div className="glass rounded-xl p-6 border border-light/20">
            <h3 className="text-lg font-bold text-light mb-3">How It Works</h3>
            <ol className="space-y-2 text-sm text-light/80">
              <li className="flex items-start">
                <span className="font-semibold mr-2">1.</span>
                <span>AI calls you at your scheduled time</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">2.</span>
                <span>Natural voice conversation about your habits</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">3.</span>
                <span>AI logs your responses automatically</span>
              </li>
              <li className="flex items-start">
                <span className="font-semibold mr-2">4.</span>
                <span>Get personalized encouragement and tips</span>
              </li>
            </ol>
          </div>

          {/* Call History */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-bold text-light mb-4">Recent Calls</h3>
            {callHistory.length === 0 ? (
              <p className="text-light/50 text-sm">No calls yet. Schedule your first call above!</p>
            ) : (
              <div className="space-y-3">
                {callHistory.slice(0, 5).map((call, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-light/10 rounded-lg">
                    <div>
                      <div className="font-semibold text-light">
                        {new Date(call.started_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-light/50">
                        {new Date(call.started_at).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${
                        call.duration_seconds > 0 ? 'text-green-400' : 'text-light/50'
                      }`}>
                        {call.duration_seconds > 0 ? `${call.duration_seconds}s` : 'Missed'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
