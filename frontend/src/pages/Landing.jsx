import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Hero from '../components/Hero'
import Journey from '../components/Journey'
import { api } from '../services/api'

function Landing() {
  const navigate = useNavigate()
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([])

  useEffect(() => {
    // Load some sample data for the landing page (guest mode)
    loadSampleData()
  }, [])

  const loadSampleData = async () => {
    try {
      // For landing page, we can show sample/demo data or empty state
      // This gives users a preview of what they'll see after signing up
      setHabits([])
      setLogs([])
    } catch (error) {
      console.error('Failed to load sample data:', error)
    }
  }

  const handleExplore = () => {
    // Smooth scroll to journey section
    setTimeout(() => {
      document.getElementById('journey')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const handleGetStarted = () => {
    // Navigate to login page
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-theme-bg">
      {/* Hero Section */}
      <section className="min-h-screen">
        <Hero 
          onExplore={handleExplore}
          habits={habits}
          completions={logs}
          achievements={[]} 
        />
      </section>

      {/* Journey Section */}
      <section id="journey" className="min-h-screen">
        <Journey 
          onContinue={handleGetStarted}
          habitsCount={habits.length}
          completionsCount={logs.length}
        />
      </section>
    </div>
  )
}

export default Landing