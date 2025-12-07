import { useState, useRef, useEffect } from 'react'
import { api } from '../services/api'

export default function AgentChatBot({ habits = [], logs = [], onAction }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm your AI habit coach powered by advanced agents. I can help you create habits from natural language, optimize your schedule, and provide personalized insights!"
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showActions, setShowActions] = useState(null)
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
      // Use agent chat endpoint
      const response = await api.agentChat(userMessage, {
        habits,
        logs,
        user_id: 'default_user'
      })

      // Add assistant response
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.content || response.response,
        actions: response.actions,
        suggestions: response.suggestions
      }])

      // Show actions if available
      if (response.actions && response.actions.length > 0) {
        setShowActions(response.actions)
      }
    } catch (error) {
      console.error('Agent chat error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting. Please try again."
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action) => {
    if (onAction) {
      await onAction(action)
      setShowActions(null)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "✅ Action completed! Anything else I can help with?"
      }])
    }
  }

  const quickQuestions = [
    "Create a habit: Run 30 minutes every morning",
    "When should I schedule my workout?",
    "Suggest a new habit for me",
    "How am I doing with my habits?"
  ]

  return (
    <div className="flex flex-col h-[700px]">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 rounded-t-xl">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <span>🤖</span>
          <span>AI Agent Coach</span>
        </h2>
        <p className="text-sm text-indigo-100 mt-1">
          Powered by advanced NLP and machine learning
        </p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 bg-gray-50 p-4 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx}>
            <div
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
                
                {/* Suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-semibold text-gray-600">Suggestions:</p>
                    {msg.suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => setInput(suggestion)}
                        className="block w-full text-left text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-1 rounded"
                      >
                        💡 {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {msg.actions && msg.actions.length > 0 && idx === messages.length - 1 && (
              <div className="mt-2 ml-12 space-y-2">
                {msg.actions.map((action, i) => (
                  <div key={i} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-gray-800 mb-2">
                      Action: {action.type}
                    </p>
                    <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                      {JSON.stringify(action.data, null, 2)}
                    </pre>
                    <button
                      onClick={() => handleAction(action)}
                      className="mt-2 px-4 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                    >
                      Execute Action
                    </button>
                  </div>
                ))}
              </div>
            )}
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
      <div className="p-4 bg-white border-t flex gap-2 flex-wrap">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => setInput(q)}
            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs hover:bg-indigo-200 transition"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-4 bg-white rounded-b-xl border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Try: 'Create a habit to meditate 10 minutes daily'"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          Send
        </button>
      </form>
    </div>
  )
}
