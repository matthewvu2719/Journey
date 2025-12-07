import { useState, useRef, useEffect } from 'react'
import { api } from '../services/api'

export default function ChatBot({ habits, logs }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI habit coach. You can:\n• Create habits by describing them (e.g., 'I want to run 30 minutes every morning')\n• Ask for advice on building better habits\n• Get help optimizing your schedule\n\nWhat would you like to do?"
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const response = await api.chat(userMessage)
      
      // Add assistant response
      const assistantMessage = {
        role: 'assistant',
        content: response.response,
        action: response.action,
        action_data: response.action_data
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
      // Handle actions if present
      if (response.action) {
        console.log('Action detected:', response.action, response.action_data)
        // Actions can be handled by parent component or shown as suggestions
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Please try again."
      }])
    } finally {
      setLoading(false)
    }
  }

  const quickQuestions = [
    "Add a habit to meditate 10 minutes daily",
    "Show my habits",
    "Why am I struggling with my habits?",
    "How can I improve my morning routine?"
  ]

  return (
    <div className="flex flex-col h-[600px]">
      <h2 className="text-3xl font-bold text-gray-800 mb-4">💬 AI Habit Coach</h2>

      {/* Chat Messages */}
      <div className="flex-1 bg-gray-50 rounded-xl p-4 overflow-y-auto mb-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                  : 'bg-white text-gray-800 shadow'
              }`}
            >
              {msg.role === 'assistant' && <div className="text-2xl mb-2">🤖</div>}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl shadow">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => setInput(q)}
            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm hover:bg-indigo-200 transition"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything about habits..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  )
}
